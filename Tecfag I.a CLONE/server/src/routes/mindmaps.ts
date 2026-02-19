import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database.js';
import { authenticate, adminOnly, AuthRequest } from '../middleware/auth.js';

export const mindmapsRouter = Router();

// Validation schemas
const nodeSchema = z.object({
    id: z.string().optional(),
    label: z.string().min(1, 'Label é obrigatório'),
    type: z.enum(['machine', 'process', 'parameter']),
    x: z.number(),
    y: z.number(),
    connections: z.array(z.string()).default([]),
});

const mindmapSchema = z.object({
    name: z.string().min(1, 'Nome é obrigatório'),
    nodes: z.array(nodeSchema).default([]),
});

// GET all mindmaps
mindmapsRouter.get('/', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const mindmaps = await prisma.mindMap.findMany({
            include: {
                nodes: {
                    include: {
                        connectionsFrom: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        // Transform to expected format
        const result = mindmaps.map((mindmap) => ({
            id: mindmap.id,
            name: mindmap.name,
            createdAt: mindmap.createdAt,
            updatedAt: mindmap.updatedAt,
            nodes: mindmap.nodes.map((node) => ({
                id: node.id,
                label: node.label,
                type: node.type,
                x: node.x,
                y: node.y,
                connections: node.connectionsFrom.map((c) => c.toNodeId),
            })),
        }));

        res.json(result);
    } catch (error) {
        console.error('Get mindmaps error:', error);
        res.status(500).json({ error: 'Erro ao buscar mapas mentais' });
    }
});

// GET single mindmap
mindmapsRouter.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const mindmap = await prisma.mindMap.findUnique({
            where: { id: req.params.id },
            include: {
                nodes: {
                    include: {
                        connectionsFrom: true,
                    },
                },
            },
        });

        if (!mindmap) {
            res.status(404).json({ error: 'Mapa mental não encontrado' });
            return;
        }

        res.json({
            id: mindmap.id,
            name: mindmap.name,
            createdAt: mindmap.createdAt,
            updatedAt: mindmap.updatedAt,
            nodes: mindmap.nodes.map((node) => ({
                id: node.id,
                label: node.label,
                type: node.type,
                x: node.x,
                y: node.y,
                connections: node.connectionsFrom.map((c) => c.toNodeId),
            })),
        });
    } catch (error) {
        console.error('Get mindmap error:', error);
        res.status(500).json({ error: 'Erro ao buscar mapa mental' });
    }
});

// POST create mindmap (admin only)
mindmapsRouter.post('/', authenticate, adminOnly, async (req: AuthRequest, res: Response) => {
    try {
        const { name, nodes } = mindmapSchema.parse(req.body);

        const mindmap = await prisma.$transaction(async (tx) => {
            // Create mindmap
            const newMindmap = await tx.mindMap.create({
                data: { name },
            });

            // Create nodes with temporary ID mapping
            const idMapping: Record<string, string> = {};

            for (const node of nodes) {
                const tempId = node.id || crypto.randomUUID();
                const createdNode = await tx.mindMapNode.create({
                    data: {
                        mindMapId: newMindmap.id,
                        label: node.label,
                        type: node.type,
                        x: node.x,
                        y: node.y,
                    },
                });
                idMapping[tempId] = createdNode.id;
            }

            // Create connections
            for (const node of nodes) {
                const tempId = node.id || '';
                const fromNodeId = idMapping[tempId];
                if (fromNodeId && node.connections) {
                    for (const targetTempId of node.connections) {
                        const toNodeId = idMapping[targetTempId];
                        if (toNodeId) {
                            await tx.mindMapConnection.create({
                                data: { fromNodeId, toNodeId },
                            });
                        }
                    }
                }
            }

            return tx.mindMap.findUnique({
                where: { id: newMindmap.id },
                include: {
                    nodes: {
                        include: { connectionsFrom: true },
                    },
                },
            });
        });

        res.status(201).json({
            id: mindmap?.id,
            name: mindmap?.name,
            nodes: mindmap?.nodes.map((node) => ({
                id: node.id,
                label: node.label,
                type: node.type,
                x: node.x,
                y: node.y,
                connections: node.connectionsFrom.map((c) => c.toNodeId),
            })),
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: error.errors[0].message });
            return;
        }
        console.error('Create mindmap error:', error);
        res.status(500).json({ error: 'Erro ao criar mapa mental' });
    }
});

// POST generate mindmap from document (AI)
mindmapsRouter.post('/generate', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const { documentId, topic } = z.object({
            documentId: z.string().min(1, 'Document ID é obrigatório'),
            topic: z.string().min(1, 'Tópico é obrigatório'),
        }).parse(req.body);

        console.log(`[MindmapAPI] Generating mindmap for doc ${documentId}, topic "${topic}"`);

        // Dynamically import to avoid circular dependencies or load issues if service file is new
        const { generateMindmapFromDocument } = await import('../services/ai/mindmapGenerator.js');

        // 1. Generate structure via AI
        const aiData = await generateMindmapFromDocument(documentId, topic, req.user?.id || 'system');

        // 2. Apply Auto-Layout (Basic Tree Layout)
        const layoutNodes = aiData.nodes.map(n => ({ ...n, x: 0, y: 0, level: 0 }));
        const edges = aiData.edges;

        // Build adjacency
        const adjacency: Record<string, string[]> = {};
        const reverseAdjacency: Record<string, string[]> = {};

        edges.forEach(e => {
            if (!adjacency[e.from]) adjacency[e.from] = [];
            adjacency[e.from].push(e.to);
            if (!reverseAdjacency[e.to]) reverseAdjacency[e.to] = [];
            reverseAdjacency[e.to].push(e.from);
        });

        // Find root (node with no incoming edges, or the first one)
        let rootId = layoutNodes.find(n => !reverseAdjacency[n.id])?.id || layoutNodes[0].id;

        // BFS for levels
        const queue = [{ id: rootId, level: 0 }];
        const visited = new Set<string>([rootId]);
        const levels: Record<number, string[]> = { 0: [rootId] };

        while (queue.length > 0) {
            const current = queue.shift()!;

            // Assign level to node object
            const nodeIndex = layoutNodes.findIndex(n => n.id === current.id);
            if (nodeIndex !== -1) {
                layoutNodes[nodeIndex].level = current.level;
            }

            const children = adjacency[current.id] || [];
            for (const childId of children) {
                if (!visited.has(childId)) {
                    visited.add(childId);
                    const nextLevel = current.level + 1;
                    queue.push({ id: childId, level: nextLevel });

                    if (!levels[nextLevel]) levels[nextLevel] = [];
                    levels[nextLevel].push(childId);
                }
            }
        }

        // Assign X, Y
        const LEVEL_HEIGHT = 150;
        const NODE_WIDTH = 250;
        const START_X = 500;
        const START_Y = 100;

        layoutNodes.forEach(node => {
            const level = node.level;
            const nodesInLevel = levels[level] || [node.id];
            const positionInLevel = nodesInLevel.indexOf(node.id);
            const levelWidth = nodesInLevel.length * NODE_WIDTH;
            const startXLevel = START_X - (levelWidth / 2);

            node.x = startXLevel + (positionInLevel * NODE_WIDTH);
            node.y = START_Y + (level * LEVEL_HEIGHT);
        });

        // 3. Save to Database
        const mindmap = await prisma.$transaction(async (tx) => {
            const newMindmap = await tx.mindMap.create({
                data: { name: `Fluxo: ${topic}` },
            });

            // Map temporary IDs (1, 2, 3...) to Real UUIDs
            const idMapping: Record<string, string> = {};

            // Create nodes
            for (const node of layoutNodes) {
                const createdNode = await tx.mindMapNode.create({
                    data: {
                        mindMapId: newMindmap.id,
                        label: node.label,
                        type: node.type,
                        x: node.x,
                        y: node.y,
                    },
                });
                idMapping[node.id] = createdNode.id;
            }

            // Create connections
            for (const edge of edges) {
                const fromNodeId = idMapping[edge.from];
                const toNodeId = idMapping[edge.to];
                if (fromNodeId && toNodeId) {
                    await tx.mindMapConnection.create({
                        data: { fromNodeId, toNodeId },
                    });
                }
            }

            return tx.mindMap.findUnique({
                where: { id: newMindmap.id },
                include: {
                    nodes: {
                        include: { connectionsFrom: true },
                    },
                },
            });
        });

        res.status(201).json({
            id: mindmap?.id,
            name: mindmap?.name,
            nodes: mindmap?.nodes.map((node) => ({
                id: node.id,
                label: node.label,
                type: node.type,
                x: node.x,
                y: node.y,
                connections: node.connectionsFrom.map((c) => c.toNodeId),
            })),
        });

    } catch (error: any) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: error.errors[0].message });
            return;
        }
        console.error('Mindmap Generation error:', error);
        res.status(500).json({ error: error.message || 'Erro ao gerar mapa mental' });
    }
});

// POST generate mindmap from Chat Context (AI)
mindmapsRouter.post('/generate-from-chat', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const { context, topic } = z.object({
            context: z.string().min(10, 'Contexto deve ter pelo menos 10 caracteres'),
            topic: z.string().min(1, 'Tópico é obrigatório'),
        }).parse(req.body);

        console.log(`[MindmapAPI] Generating mindmap from CHAT context, topic "${topic}"`);

        const { generateMindmapFromContext } = await import('../services/ai/mindmapGenerator.js');

        // 1. Generate structure via AI
        const aiData = await generateMindmapFromContext(context, topic, req.user?.id || 'system');

        // 2. Apply Auto-Layout (Duplicate logic for now to keep it safe, normally we'd refactor to helper)
        const layoutNodes = aiData.nodes.map(n => ({ ...n, x: 0, y: 0, level: 0 }));
        const edges = aiData.edges;
        const adjacency: Record<string, string[]> = {};
        const reverseAdjacency: Record<string, string[]> = {};

        edges.forEach(e => {
            if (!adjacency[e.from]) adjacency[e.from] = [];
            adjacency[e.from].push(e.to);
            if (!reverseAdjacency[e.to]) reverseAdjacency[e.to] = [];
            reverseAdjacency[e.to].push(e.from);
        });

        let rootId = layoutNodes.find(n => !reverseAdjacency[n.id])?.id || layoutNodes[0].id;
        const queue = [{ id: rootId, level: 0 }];
        const visited = new Set<string>([rootId]);
        const levels: Record<number, string[]> = { 0: [rootId] };

        while (queue.length > 0) {
            const current = queue.shift()!;
            const nodeIndex = layoutNodes.findIndex(n => n.id === current.id);
            if (nodeIndex !== -1) { layoutNodes[nodeIndex].level = current.level; }
            const children = adjacency[current.id] || [];
            for (const childId of children) {
                if (!visited.has(childId)) {
                    visited.add(childId);
                    const nextLevel = current.level + 1;
                    queue.push({ id: childId, level: nextLevel });
                    if (!levels[nextLevel]) levels[nextLevel] = [];
                    levels[nextLevel].push(childId);
                }
            }
        }

        const LEVEL_HEIGHT = 150;
        const NODE_WIDTH = 250;
        const START_X = 500;
        const START_Y = 100;

        layoutNodes.forEach(node => {
            const level = node.level;
            const nodesInLevel = levels[level] || [node.id];
            const positionInLevel = nodesInLevel.indexOf(node.id);
            const levelWidth = nodesInLevel.length * NODE_WIDTH;
            const startXLevel = START_X - (levelWidth / 2);
            node.x = startXLevel + (positionInLevel * NODE_WIDTH);
            node.y = START_Y + (level * LEVEL_HEIGHT);
        });

        // 3. Save to Database
        const mindmap = await prisma.$transaction(async (tx) => {
            const newMindmap = await tx.mindMap.create({ data: { name: `Chat: ${topic}` } });
            const idMapping: Record<string, string> = {};
            for (const node of layoutNodes) {
                const createdNode = await tx.mindMapNode.create({
                    data: { mindMapId: newMindmap.id, label: node.label, type: node.type, x: node.x, y: node.y },
                });
                idMapping[node.id] = createdNode.id;
            }
            for (const edge of edges) {
                const fromNodeId = idMapping[edge.from];
                const toNodeId = idMapping[edge.to];
                if (fromNodeId && toNodeId) {
                    await tx.mindMapConnection.create({ data: { fromNodeId, toNodeId } });
                }
            }
            return tx.mindMap.findUnique({
                where: { id: newMindmap.id },
                include: { nodes: { include: { connectionsFrom: true } } },
            });
        });

        res.status(201).json({
            id: mindmap?.id,
            name: mindmap?.name,
            nodes: mindmap?.nodes.map((node) => ({
                id: node.id,
                label: node.label,
                type: node.type,
                x: node.x,
                y: node.y,
                connections: node.connectionsFrom.map((c) => c.toNodeId),
            })),
        });

    } catch (error: any) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: error.errors[0].message });
            return;
        }
        console.error('Chat Mindmap Generation error:', error);
        res.status(500).json({ error: error.message || 'Erro ao gerar mapa mental do chat' });
    }
});

// PUT update mindmap
mindmapsRouter.put('/:id', authenticate, adminOnly, async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { name, nodes } = req.body;

        const existing = await prisma.mindMap.findUnique({ where: { id } });
        if (!existing) {
            res.status(404).json({ error: 'Mapa mental não encontrado' });
            return;
        }

        // 1. Rename only
        if (name && !nodes) {
            const updated = await prisma.mindMap.update({
                where: { id },
                data: { name },
                include: {
                    nodes: {
                        include: { connectionsFrom: true }
                    }
                }
            });

            res.json({
                id: updated.id,
                name: updated.name,
                nodes: updated.nodes.map(n => ({
                    id: n.id,
                    label: n.label,
                    type: n.type,
                    x: n.x,
                    y: n.y,
                    connections: n.connectionsFrom.map(c => c.toNodeId)
                }))
            });
            return;
        }

        // 2. Full Update
        if (nodes) {
            const mindmap = await prisma.$transaction(async (tx) => {
                if (name) {
                    await tx.mindMap.update({ where: { id }, data: { name } });
                }

                await tx.mindMapConnection.deleteMany({
                    where: { fromNode: { mindMapId: id } }
                });

                await tx.mindMapNode.deleteMany({
                    where: { mindMapId: id }
                });

                const idMapping: Record<string, string> = {};
                for (const node of nodes) {
                    const createdNode = await tx.mindMapNode.create({
                        data: {
                            mindMapId: id,
                            label: node.label,
                            type: node.type,
                            x: node.x,
                            y: node.y,
                        },
                    });
                    idMapping[node.id] = createdNode.id;
                }

                for (const node of nodes) {
                    const fromNodeId = idMapping[node.id];
                    if (fromNodeId && node.connections) {
                        for (const targetId of node.connections) {
                            const toNodeId = idMapping[targetId];
                            if (toNodeId) {
                                await tx.mindMapConnection.create({
                                    data: { fromNodeId, toNodeId },
                                });
                            }
                        }
                    }
                }

                return tx.mindMap.findUnique({
                    where: { id },
                    include: { nodes: { include: { connectionsFrom: true } } },
                });
            });

            res.json({
                id: mindmap?.id,
                name: mindmap?.name,
                nodes: mindmap?.nodes.map((node) => ({
                    id: node.id,
                    label: node.label,
                    type: node.type,
                    x: node.x,
                    y: node.y,
                    connections: node.connectionsFrom.map((c) => c.toNodeId),
                })),
            });
        }
    } catch (error) {
        console.error('Update mindmap error:', error);
        res.status(500).json({ error: 'Erro ao atualizar mapa mental' });
    }
});

// DELETE mindmap (admin only)
mindmapsRouter.delete('/:id', authenticate, adminOnly, async (req: AuthRequest, res: Response) => {
    try {
        const existingMindmap = await prisma.mindMap.findUnique({
            where: { id: req.params.id },
        });

        if (!existingMindmap) {
            res.status(404).json({ error: 'Mapa mental não encontrado' });
            return;
        }

        await prisma.mindMap.delete({
            where: { id: req.params.id },
        });

        res.json({ message: 'Mapa mental excluído com sucesso' });
    } catch (error) {
        console.error('Delete mindmap error:', error);
        res.status(500).json({ error: 'Erro ao excluir mapa mental' });
    }
});
