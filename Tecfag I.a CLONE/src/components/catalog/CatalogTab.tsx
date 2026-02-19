import { useState, useMemo, useEffect } from "react";
import { CatalogHeader } from "./CatalogHeader";
import { CatalogFilters } from "./CatalogFilters";
import { MachineCard } from "./MachineCard";
import { MachineDetails } from "./MachineDetails";
import { CategoryGrid } from "./CategoryGrid";
import { CatalogTabProps, Machine, INITIAL_TAGS, STOCK_OPTIONS } from "@/types/catalog";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

// --- DATA ---
const initialMachines: Machine[] = [
  // ========== TÚNEIS DE ENCOLHIMENTO ==========
  {
    id: "tu-001",
    name: "TUNEL DE ENCOLHIMENTO 220V/60HZ, 1 FASE",
    category: "Túneis de Encolhimento",
    model: "BS-20",
    next: "PAMQSLTU087",
    price: "Sob consulta",
    stockStatus: "in_stock",
    tags: ["Automático"],
    specifications: [
      { label: "Tipo de Plástico", value: "Plásticos termoencolhíveis" },
      { label: "Material da Embalagem", value: "PVC/PP/POF/OUTROS" },
      { label: "Largura Máx. do Produto", value: "150 mm" },
      { label: "Altura Máx. do Produto", value: "100 mm" },
      { label: "Peso Máx. de Carga", value: "5 kg" },
      { label: "Produtividade", value: "9 m/min" },
      { label: "Tipo de Máquina", value: "Automática" },
    ],
    images: [],
    youtubeUrl: "",
  },
  {
    id: "tu-002",
    name: "TUNEL DE ENCOLHIMENTO P/ EMBALAR 220V/60HZ/3F",
    category: "Túneis de Encolhimento",
    model: "BS-8030L",
    next: "PAMQSLTU073",
    price: "Sob consulta",
    stockStatus: "in_stock",
    tags: ["Automático"],
    specifications: [
      { label: "Tipo de Plástico", value: "Plásticos termoencolhíveis" },
      { label: "Material da Embalagem", value: "PVC/PP/POF/OUTROS" },
      { label: "Largura Máx. do Produto", value: "650 mm" },
      { label: "Altura Máx. do Produto", value: "230 mm" },
      { label: "Peso Máx. de Carga", value: "80 kg" },
      { label: "Produtividade", value: "10 m/min" },
      { label: "Tipo de Máquina", value: "Automática" },
    ],
    images: [],
    youtubeUrl: "",
  },
  {
    id: "tu-003",
    name: "TUNEL DE ENCOLHIMENTO P/ EMBALAR 380V/60HZ/3F",
    category: "Túneis de Encolhimento",
    model: "BS-8030L",
    next: "PAMQSLTU072",
    price: "Sob consulta",
    stockStatus: "in_stock",
    tags: ["Automático"],
    specifications: [
      { label: "Tipo de Plástico", value: "Plásticos termoencolhíveis" },
      { label: "Material da Embalagem", value: "PVC/PP/POF/OUTROS" },
      { label: "Largura Máx. do Produto", value: "650 mm" },
      { label: "Altura Máx. do Produto", value: "230 mm" },
      { label: "Peso Máx. de Carga", value: "80 kg" },
      { label: "Produtividade", value: "10 m/min" },
      { label: "Tipo de Máquina", value: "Automática" },
    ],
    images: [],
    youtubeUrl: "",
  },
  {
    id: "tu-004",
    name: "TUNEL DE ENCOLH. C/ ESTEIRA EM ROLOS - 380V/60HZ,3F",
    category: "Túneis de Encolhimento",
    model: "BS-4535LA",
    next: "PAMQSLTU070",
    price: "Sob consulta",
    stockStatus: "in_stock",
    tags: ["Automático"],
    specifications: [
      { label: "Tipo de Plástico", value: "Plásticos termoencolhíveis" },
      { label: "Material da Embalagem", value: "PVC/PP/POF/OUTROS" },
      { label: "Largura Máx. do Produto", value: "400 mm" },
      { label: "Altura Máx. do Produto", value: "300 mm" },
      { label: "Peso Máx. de Carga", value: "10 kg" },
      { label: "Produtividade", value: "0-10 m/min" },
      { label: "Tipo de Máquina", value: "Automática" },
    ],
    images: [],
    youtubeUrl: "",
  },
  {
    id: "tu-005",
    name: "TUNEL DE ENCOLH. C/ ESTEIRA EM ROLOS - 380V/60HZ,3F",
    category: "Túneis de Encolhimento",
    model: "BS-6535LA",
    next: "PAMQSLTU069",
    price: "Sob consulta",
    stockStatus: "in_stock",
    tags: ["Automático"],
    specifications: [
      { label: "Tipo de Plástico", value: "Plásticos termoencolhíveis" },
      { label: "Material da Embalagem", value: "PVC/PP/POF/OUTROS" },
      { label: "Largura Máx. do Produto", value: "600 mm" },
      { label: "Altura Máx. do Produto", value: "300 mm" },
      { label: "Peso Máx. de Carga", value: "30 kg" },
      { label: "Produtividade", value: "0-10 m/min" },
      { label: "Tipo de Máquina", value: "Automática" },
    ],
    images: [],
    youtubeUrl: "",
  },
  {
    id: "tu-006",
    name: "TUNEL PARA SLEEVE A VAPOR EM ACO INOX",
    category: "Túneis de Encolhimento",
    model: "BS2450S-PLUS",
    next: "PAMQSLTU057",
    price: "Sob consulta",
    stockStatus: "in_stock",
    tags: ["Automático"],
    specifications: [
      { label: "Tipo de Plástico", value: "Sleeve termoencolhíveis" },
      { label: "Material da Embalagem", value: "PVC/PET/OPS" },
      { label: "Largura Máx. do Produto", value: "240 mm" },
      { label: "Altura Máx. do Produto", value: "450 mm" },
      { label: "Peso Máx. de Carga", value: "10 kg" },
      { label: "Produtividade", value: "3000 frascos/hora" },
      { label: "Tipo de Máquina", value: "Automática" },
    ],
    images: [],
    youtubeUrl: "",
  },
  {
    id: "tu-007",
    name: "TUNEL DE ENCOLH. C/ ESTEIRA EM ROLOS - 220V/60HZ,3F",
    category: "Túneis de Encolhimento",
    model: "BS-6535LA",
    next: "PAMQSLTU035",
    price: "Sob consulta",
    stockStatus: "in_stock",
    tags: ["Automático"],
    specifications: [
      { label: "Tipo de Plástico", value: "Plásticos termoencolhíveis" },
      { label: "Material da Embalagem", value: "PVC/PP/POF/OUTROS" },
      { label: "Largura Máx. do Produto", value: "600 mm" },
      { label: "Altura Máx. do Produto", value: "300 mm" },
      { label: "Peso Máx. de Carga", value: "30 kg" },
      { label: "Produtividade", value: "0-10 m/min" },
      { label: "Tipo de Máquina", value: "Automática" },
    ],
    images: [],
    youtubeUrl: "",
  },
  {
    id: "tu-008",
    name: "TUNEL DE ENCOLH. C/ ESTEIRA EM ROLOS - 220V/60HZ,3F",
    category: "Túneis de Encolhimento",
    model: "BS-4535LA",
    next: "PAMQSLTU034",
    price: "Sob consulta",
    stockStatus: "in_stock",
    tags: ["Automático"],
    specifications: [
      { label: "Tipo de Plástico", value: "Plásticos termoencolhíveis" },
      { label: "Material da Embalagem", value: "PVC/PP/POF/OUTROS" },
      { label: "Largura Máx. do Produto", value: "400 mm" },
      { label: "Altura Máx. do Produto", value: "300 mm" },
      { label: "Peso Máx. de Carga", value: "10 kg" },
      { label: "Produtividade", value: "0-10 m/min" },
      { label: "Tipo de Máquina", value: "Automática" },
    ],
    images: [],
    youtubeUrl: "",
  },
  {
    id: "tu-009",
    name: "TUNEL DE ENCOLH. C/ ESTEIRA EM ROLOS - 220V/60HZ,1F",
    category: "Túneis de Encolhimento",
    model: "BS-4525A",
    next: "PAMQSLTU033",
    price: "Sob consulta",
    stockStatus: "in_stock",
    tags: ["Automático"],
    specifications: [
      { label: "Tipo de Plástico", value: "Plásticos termoencolhíveis" },
      { label: "Material da Embalagem", value: "PVC/PP/POF/OUTROS" },
      { label: "Largura Máx. do Produto", value: "400 mm" },
      { label: "Altura Máx. do Produto", value: "200 mm" },
      { label: "Peso Máx. de Carga", value: "10 kg" },
      { label: "Produtividade", value: "0-10 m/min" },
      { label: "Tipo de Máquina", value: "Automática" },
    ],
    images: [],
    youtubeUrl: "",
  },
  {
    id: "tu-010",
    name: "TUNEL DE ENCOLH. C/ ESTEIRA EM ROLOS - 220V/60HZ,1F",
    category: "Túneis de Encolhimento",
    model: "BS-3020A",
    next: "PAMQSLTU032",
    price: "Sob consulta",
    stockStatus: "in_stock",
    tags: ["Automático"],
    specifications: [
      { label: "Tipo de Plástico", value: "Plásticos termoencolhíveis" },
      { label: "Material da Embalagem", value: "PVC/PP/POF/OUTROS" },
      { label: "Largura Máx. do Produto", value: "250 mm" },
      { label: "Altura Máx. do Produto", value: "150 mm" },
      { label: "Peso Máx. de Carga", value: "10 kg" },
      { label: "Produtividade", value: "0-10 m/min" },
      { label: "Tipo de Máquina", value: "Automática" },
    ],
    images: [],
    youtubeUrl: "",
  },
  {
    id: "tu-011",
    name: "TUNEL DE ENCOLHIMENTO P/ EMBALAR - 380V",
    category: "Túneis de Encolhimento",
    model: "BSD450B",
    next: "PAMQSLTU031",
    price: "Sob consulta",
    stockStatus: "in_stock",
    tags: ["Automático"],
    specifications: [
      { label: "Tipo de Plástico", value: "Plásticos termoencolhíveis" },
      { label: "Material da Embalagem", value: "PVC/PP/POF/OUTROS" },
      { label: "Largura Máx. do Produto", value: "400 mm" },
      { label: "Altura Máx. do Produto", value: "200 mm" },
      { label: "Peso Máx. de Carga", value: "10 kg" },
      { label: "Produtividade", value: "0-10 m/min" },
      { label: "Tipo de Máquina", value: "Automática" },
    ],
    images: [],
    youtubeUrl: "",
  },
  {
    id: "tu-012",
    name: "TUNEL DE ENCOLHIMENTO P/ ROTULOS (220V) (PINTADO)",
    category: "Túneis de Encolhimento",
    model: "BSD1535P",
    next: "PAMQSLTU028",
    price: "Sob consulta",
    stockStatus: "in_stock",
    tags: ["Automático"],
    specifications: [
      { label: "Tipo de Plástico", value: "Sleeve termoencolhíveis" },
      { label: "Material da Embalagem", value: "PVC/PET/OPS" },
      { label: "Largura Máx. do Produto", value: "150 mm" },
      { label: "Altura Máx. do Produto", value: "300 mm" },
      { label: "Peso Máx. de Carga", value: "5 kg" },
      { label: "Produtividade", value: "0-4 m/min" },
      { label: "Tipo de Máquina", value: "Automática" },
    ],
    images: [],
    youtubeUrl: "",
  },
  {
    id: "tu-013",
    name: "TUNEL DE ENCOLHIMENTO A VAPOR P/ ROTULOS SLEEVE",
    category: "Túneis de Encolhimento",
    model: "BSD1535ST",
    next: "PAMQSLTU027",
    price: "Sob consulta",
    stockStatus: "in_stock",
    tags: ["Automático"],
    specifications: [
      { label: "Tipo de Plástico", value: "Sleeve termoencolhíveis" },
      { label: "Material da Embalagem", value: "PVC/PET/OPS" },
      { label: "Largura Máx. do Produto", value: "100 mm" },
      { label: "Altura Máx. do Produto", value: "300 mm" },
      { label: "Peso Máx. de Carga", value: "5 kg" },
      { label: "Produtividade", value: "30 m/min" },
      { label: "Tipo de Máquina", value: "Automática" },
    ],
    images: [],
    youtubeUrl: "",
  },
  {
    id: "tu-014",
    name: "TUNEL DE ENCOLHIMENTO P/ EMBALAR (220V)",
    category: "Túneis de Encolhimento",
    model: "BSD450B",
    next: "PAMQSLTU018",
    price: "Sob consulta",
    stockStatus: "in_stock",
    tags: ["Automático"],
    specifications: [
      { label: "Tipo de Plástico", value: "Plásticos termoencolhíveis" },
      { label: "Material da Embalagem", value: "PVC/PP/POF/OUTROS" },
      { label: "Largura Máx. do Produto", value: "400 mm" },
      { label: "Altura Máx. do Produto", value: "200 mm" },
      { label: "Peso Máx. de Carga", value: "10 kg" },
      { label: "Produtividade", value: "0-10 m/min" },
      { label: "Tipo de Máquina", value: "Automática" },
    ],
    images: [],
    youtubeUrl: "",
  },
  {
    id: "tu-015",
    name: "TUNEL DE ENCOLHIMENTO P/ EMBALAR (220V)",
    category: "Túneis de Encolhimento",
    model: "BSD400B",
    next: "PAMQSLTU017",
    price: "Sob consulta",
    stockStatus: "in_stock",
    tags: ["Automático"],
    specifications: [
      { label: "Tipo de Plástico", value: "Plásticos termoencolhíveis" },
      { label: "Material da Embalagem", value: "PVC/PP/POF/OUTROS" },
      { label: "Largura Máx. do Produto", value: "350 mm" },
      { label: "Altura Máx. do Produto", value: "150 mm" },
      { label: "Peso Máx. de Carga", value: "5 kg" },
      { label: "Produtividade", value: "0-10 m/min" },
      { label: "Tipo de Máquina", value: "Automática" },
    ],
    images: [],
    youtubeUrl: "",
  },
  {
    id: "tu-016",
    name: "TUNEL DE ENCOLHIMENTO P/ EMBALAR (220V)",
    category: "Túneis de Encolhimento",
    model: "BSD350B",
    next: "PAMQSLTU016",
    price: "Sob consulta",
    stockStatus: "in_stock",
    tags: ["Automático"],
    specifications: [
      { label: "Tipo de Plástico", value: "Plásticos termoencolhíveis" },
      { label: "Material da Embalagem", value: "PVC/PP/POF/OUTROS" },
      { label: "Largura Máx. do Produto", value: "300 mm" },
      { label: "Altura Máx. do Produto", value: "100 mm" },
      { label: "Peso Máx. de Carga", value: "5 kg" },
      { label: "Produtividade", value: "0-10 m/min" },
      { label: "Tipo de Máquina", value: "Automática" },
    ],
    images: [],
    youtubeUrl: "",
  },
  {
    id: "tu-017",
    name: "TUNEL DE ENCOLHIMENTO P/ EMBALAR (220/380V)",
    category: "Túneis de Encolhimento",
    model: "BSD4525A",
    next: "PAMQSLTU012",
    price: "Sob consulta",
    stockStatus: "in_stock",
    tags: ["Automático"],
    specifications: [
      { label: "Tipo de Plástico", value: "Plásticos termoencolhíveis" },
      { label: "Material da Embalagem", value: "PVC/PP/POF/OUTROS" },
      { label: "Largura Máx. do Produto", value: "400 mm" },
      { label: "Altura Máx. do Produto", value: "200 mm" },
      { label: "Peso Máx. de Carga", value: "25 kg" },
      { label: "Produtividade", value: "0-15 m/min" },
      { label: "Tipo de Máquina", value: "Automática" },
    ],
    images: [],
    youtubeUrl: "",
  },
  {
    id: "tu-018",
    name: "TUNEL DE ENCOLHIMENTO P/ EMBALAR (380/220V)",
    category: "Túneis de Encolhimento",
    model: "BSD4020A",
    next: "PAMQSLTU011",
    price: "Sob consulta",
    stockStatus: "in_stock",
    tags: ["Automático"],
    specifications: [
      { label: "Tipo de Plástico", value: "Plásticos termoencolhíveis" },
      { label: "Material da Embalagem", value: "PVC/PP/POF/OUTROS" },
      { label: "Largura Máx. do Produto", value: "350 mm" },
      { label: "Altura Máx. do Produto", value: "160 mm" },
      { label: "Peso Máx. de Carga", value: "25 kg" },
      { label: "Produtividade", value: "0-15 m/min" },
      { label: "Tipo de Máquina", value: "Automática" },
    ],
    images: [],
    youtubeUrl: "",
  },
  {
    id: "tu-019",
    name: "TUNEL DE ENCOLHIMENTO P/ ROTULOS (220V) (INOX)",
    category: "Túneis de Encolhimento",
    model: "BSD1535S",
    next: "PAMQSLTU010",
    price: "Sob consulta",
    stockStatus: "in_stock",
    tags: ["Automático"],
    specifications: [
      { label: "Tipo de Plástico", value: "Sleeve termoencolhíveis" },
      { label: "Material da Embalagem", value: "PVC/PET/OPS" },
      { label: "Largura Máx. do Produto", value: "150 mm" },
      { label: "Altura Máx. do Produto", value: "300 mm" },
      { label: "Peso Máx. de Carga", value: "5 kg" },
      { label: "Produtividade", value: "0-4 m/min" },
      { label: "Tipo de Máquina", value: "Automática" },
    ],
    images: [],
    youtubeUrl: "",
  },

  // ========== TERMOFORMADORAS DE BLISTER ==========
  {
    id: "tf-001",
    name: "FORMADORA E SELADORA DE BLISTER",
    category: "Termoformadoras",
    model: "EVOLUTION 140",
    next: "PAMQSLSA008",
    price: "Sob consulta",
    stockStatus: "in_stock",
    tags: ["Automático"],
    specifications: [
      { label: "Embalagem", value: "Blister" },
      { label: "Material da Embalagem", value: "Alumínio-Plástico ou Alumínio-Alumínio" },
      { label: "Tipo de Máquina", value: "Automática" },
    ],
    images: [],
    youtubeUrl: "",
  },
  {
    id: "tf-002",
    name: "TERMOFORMADORA AUTOMATICA DE BLISTER",
    category: "Termoformadoras",
    model: "EVOLUTION 150",
    next: "PAMQSLSA044",
    price: "Sob consulta",
    stockStatus: "in_stock",
    tags: ["Automático"],
    specifications: [
      { label: "Embalagem", value: "Blister" },
      { label: "Material da Embalagem", value: "Alumínio-Plástico ou Alumínio-Alumínio" },
      { label: "Tipo de Máquina", value: "Automática" },
    ],
    images: [],
    youtubeUrl: "",
  },
  {
    id: "tf-003",
    name: "TERMOFORMADORA DE BLISTER AUTOMATICA ALU-PVC",
    category: "Termoformadoras",
    model: "EVOLUTION 250",
    next: "PAMQSLSA024",
    price: "Sob consulta",
    stockStatus: "in_stock",
    tags: ["Automático"],
    specifications: [
      { label: "Embalagem", value: "Blister" },
      { label: "Material da Embalagem", value: "Alumínio-Plástico ou Alumínio-Alumínio" },
      { label: "Tipo de Máquina", value: "Automática" },
    ],
    images: [],
    youtubeUrl: "",
  },
  {
    id: "tf-004",
    name: "TERMOFORMADORA AUTOMATICA DE BLISTER",
    category: "Termoformadoras",
    model: "EVOLUTION 260H",
    next: "PAMQSLSA026",
    price: "Sob consulta",
    stockStatus: "in_stock",
    tags: ["Automático"],
    specifications: [
      { label: "Embalagem", value: "Blister" },
      { label: "Material da Embalagem", value: "Alumínio-Plástico ou Alumínio-Alumínio" },
      { label: "Tipo de Máquina", value: "Automática" },
    ],
    images: [],
    youtubeUrl: "",
  },
  {
    id: "tf-005",
    name: "TERMOFORMADORA E SELADORA DE BLISTER",
    category: "Termoformadoras",
    model: "EVOLUTION 80",
    next: "PAMQSLSA005",
    price: "Sob consulta",
    stockStatus: "in_stock",
    tags: ["Automático"],
    specifications: [
      { label: "Embalagem", value: "Blister" },
      { label: "Material da Embalagem", value: "Alumínio-Plástico ou Alumínio-Alumínio" },
      { label: "Tipo de Máquina", value: "Automática" },
    ],
    images: [],
    youtubeUrl: "",
  },
  {
    id: "tf-006",
    name: "TERMOFORMADORA AUTOMATICA DE BLISTER - SERVO MOTOR",
    category: "Termoformadoras",
    model: "EVOLUTION 260",
    next: "PAMQSLSA105",
    price: "Sob consulta",
    stockStatus: "in_stock",
    tags: ["Automático"],
    specifications: [
      { label: "Embalagem", value: "Blister" },
      { label: "Material da Embalagem", value: "Alumínio-Plástico ou Alumínio-Alumínio" },
      { label: "Tipo de Material", value: "Folha rígida PVC: 0,25-0,5 mm × 260 mm / Folha Alumínio PTP: 0,02-0,035 mm × 260 mm / Papel de Diálise: 50-100 g/m² × 250 mm" },
      { label: "Largura da Bobina", value: "330 mm" },
      { label: "Área Máx. de Formação", value: "C 240 × L 150 mm" },
      { label: "Profundidade Máx. de Formação", value: "14 mm" },
      { label: "Dimensão de Cada Cavidade", value: "C 80 × L 57 mm" },
      { label: "Produtividade", value: "Alumínio-Plástico: ≤ 300.000 un/h | Alumínio-Alumínio: ≤ 100.000 un/h" },
      { label: "Tipo de Máquina", value: "Automática" },
    ],
    images: [],
    youtubeUrl: "",
  },

  // ========== ESTEIRAS TRANSPORTADORAS ==========
  {
    id: "es-001",
    name: "PAGINADORA ROTATIVA EM ACO INOX",
    category: "Esteira Transportadora",
    model: "PAGINADORA",
    next: "PAMQIPAU007",
    price: "Sob consulta",
    stockStatus: "in_stock",
    tags: ["Automático"],
    specifications: [
      { label: "Tipo de Produto", value: "Rótulos/Papéis/Embalagens" },
      { label: "Largura do Produto", value: "50-300 mm" },
      { label: "Comprimento", value: "1500 mm" },
      { label: "Velocidade", value: "0-50 m/min" },
      { label: "Área de Corte", value: "430 mm" },
      { label: "Tipo de Máquina", value: "Automática" },
    ],
    images: [],
    youtubeUrl: "",
  },
  {
    id: "es-002",
    name: "ALIMENTADOR ELEVADOR DE CANECAS P/ EMPACOTADORAS",
    category: "Esteira Transportadora",
    model: "ELEVADOR CANECAS",
    next: "PAMQGPAU055",
    price: "Sob consulta",
    stockStatus: "in_stock",
    tags: ["Automático"],
    specifications: [
      { label: "Tipo de Produto", value: "Grãos" },
      { label: "Comprimento", value: "2100 mm" },
      { label: "Velocidade", value: "Volume de Transporte: 18.000 litros/h" },
      { label: "Altura do Elevador", value: "1900 mm" },
      { label: "Tipo de Máquina", value: "Automática" },
    ],
    images: [],
    youtubeUrl: "",
  },
  {
    id: "es-003",
    name: "ESTEIRA FIXA LONA ACO INOX C/ CONTR. VEL. - 150CMX25CMX75CM",
    category: "Esteira Transportadora",
    model: "BC1.5M/200S",
    next: "PAMQESAU004",
    price: "Sob consulta",
    stockStatus: "in_stock",
    tags: ["Automático"],
    specifications: [
      { label: "Tipo de Produto", value: "Frascos, Latas, Outros" },
      { label: "Altura do Produto", value: "Ilimitado" },
      { label: "Largura da Lona", value: "190 mm" },
      { label: "Comprimento", value: "1500 mm" },
      { label: "Velocidade", value: "9-30 m/min" },
      { label: "Tipo de Máquina", value: "Automática" },
    ],
    images: [],
    youtubeUrl: "",
  },
  {
    id: "es-004",
    name: "ESTEIRA TRASP. EM LONA 1M X 30CM LARG. C/ CONTROL. VELOC.",
    category: "Esteira Transportadora",
    model: "BC1M/W300P",
    next: "PAMQESMN012",
    price: "Sob consulta",
    stockStatus: "in_stock",
    tags: ["Automático"],
    specifications: [
      { label: "Tipo de Produto", value: "Frascos, Latas, Outros" },
      { label: "Altura do Produto", value: "Ilimitado" },
      { label: "Largura da Lona", value: "190 mm" },
      { label: "Comprimento", value: "1000 mm" },
      { label: "Velocidade", value: "30 m/min" },
      { label: "Tipo de Máquina", value: "Automática" },
    ],
    images: [],
    youtubeUrl: "",
  },
  {
    id: "es-005",
    name: "ESTEIRA TRASP. INOX EM LONA 2,5M X 30CM LARG. C/ CONTROL. VELOC.",
    category: "Esteira Transportadora",
    model: "BC2.5M/300S",
    next: "PAMQESMN016",
    price: "Sob consulta",
    stockStatus: "in_stock",
    tags: ["Automático"],
    specifications: [
      { label: "Tipo de Produto", value: "Frascos, Latas, Outros" },
      { label: "Altura do Produto", value: "Ilimitado" },
      { label: "Largura da Lona", value: "190 mm" },
      { label: "Comprimento", value: "1000 mm" },
      { label: "Velocidade", value: "30 m/min" },
      { label: "Tipo de Máquina", value: "Automática" },
    ],
    images: [],
    youtubeUrl: "",
  },
  {
    id: "es-006",
    name: "ESTEIRA TRASP. EM LONA C2,5M X L30CM C/ CONTROL. VELOC.",
    category: "Esteira Transportadora",
    model: "BC2.5M/W300P",
    next: "PAMQESMN020",
    price: "Sob consulta",
    stockStatus: "in_stock",
    tags: ["Automático"],
    specifications: [
      { label: "Tipo de Produto", value: "Frascos, Latas, Outros" },
      { label: "Altura do Produto", value: "Ilimitado" },
      { label: "Largura da Lona", value: "190 mm" },
      { label: "Comprimento", value: "2500 mm" },
      { label: "Velocidade", value: "30 m/min" },
      { label: "Tipo de Máquina", value: "Automática" },
    ],
    images: [],
    youtubeUrl: "",
  },
  {
    id: "es-007",
    name: "ESTEIRA TRASP. EM LONA C2,5M X L50CM C/ CONTROL. VELOC.",
    category: "Esteira Transportadora",
    model: "BC2.5M/W500P",
    next: "PAMQESMN022",
    price: "Sob consulta",
    stockStatus: "in_stock",
    tags: ["Automático"],
    specifications: [
      { label: "Tipo de Produto", value: "Frascos, Latas, Outros" },
      { label: "Altura do Produto", value: "Ilimitado" },
      { label: "Comprimento", value: "2500 mm" },
      { label: "Velocidade", value: "30 m/min" },
      { label: "Tipo de Máquina", value: "Automática" },
    ],
    images: [],
    youtubeUrl: "",
  },
  {
    id: "es-008",
    name: "ESTEIRA TRASP. INOX LONA C2,5M X L50CM / ACO INOX / CONTROL. VELOC.",
    category: "Esteira Transportadora",
    model: "BC2.5M/W500S",
    next: "PAMQESMN013",
    price: "Sob consulta",
    stockStatus: "in_stock",
    tags: ["Automático"],
    specifications: [
      { label: "Tipo de Produto", value: "Frascos, Latas, Outros" },
      { label: "Altura do Produto", value: "Ilimitado" },
      { label: "Comprimento", value: "2500 mm" },
      { label: "Velocidade", value: "30 m/min" },
      { label: "Tipo de Máquina", value: "Automática" },
    ],
    images: [],
    youtubeUrl: "",
  },
  {
    id: "es-009",
    name: "MESA ACUMULADORA GIRATORIA 1000MM",
    category: "Esteira Transportadora",
    model: "BTT1000",
    next: "PAMQESAU005",
    price: "Sob consulta",
    stockStatus: "in_stock",
    tags: ["Automático"],
    specifications: [
      { label: "Tipo de Produto", value: "Frascos" },
      { label: "Diâmetro do Produto", value: "Ø20-100 mm" },
      { label: "Altura do Produto", value: "20-150 mm" },
      { label: "Comprimento", value: "1000 mm" },
      { label: "Velocidade", value: "0-10 rotações/min" },
      { label: "Tipo de Máquina", value: "Automática" },
    ],
    images: [],
    youtubeUrl: "",
  },
  {
    id: "es-010",
    name: "ESTEIRA TRANSPORTADORA 1M C/ CONTROLE DE VELOC. P/ AUTOM.",
    category: "Esteira Transportadora",
    model: "ESTEIRA 1M",
    next: "PAMQESMA006",
    price: "Sob consulta",
    stockStatus: "in_stock",
    tags: ["Automático"],
    specifications: [
      { label: "Tipo de Produto", value: "Frascos, Latas, Outros" },
      { label: "Altura do Produto", value: "Ilimitado" },
      { label: "Comprimento", value: "1000 mm" },
      { label: "Tipo de Máquina", value: "Automática" },
    ],
    images: [],
    youtubeUrl: "",
  },
  {
    id: "es-011",
    name: "ESTEIRA TRANSPORTADORA COM ROLETES MOTORIZADA",
    category: "Esteira Transportadora",
    model: "RC1M/D",
    next: "PAMQESMA004",
    price: "Sob consulta",
    stockStatus: "in_stock",
    tags: ["Automático"],
    specifications: [
      { label: "Tipo de Produto", value: "Caixas, Outros" },
      { label: "Altura do Produto", value: "Ilimitado" },
      { label: "Largura do Rolete", value: "480 mm" },
      { label: "Comprimento", value: "1000 mm" },
      { label: "Velocidade", value: "15 m/min" },
      { label: "Tipo de Máquina", value: "Automática" },
    ],
    images: [],
    youtubeUrl: "",
  },
  {
    id: "es-012",
    name: "ESTEIRA TRANSPORTADORA DE ROLETES",
    category: "Esteira Transportadora",
    model: "RC1M/DP",
    next: "PAMQESMA007",
    price: "Sob consulta",
    stockStatus: "in_stock",
    tags: ["Automático"],
    specifications: [
      { label: "Tipo de Produto", value: "Caixas, Outros" },
      { label: "Altura do Produto", value: "Ilimitado" },
      { label: "Comprimento", value: "1000 mm" },
      { label: "Velocidade", value: "15 m/min" },
      { label: "Tipo de Máquina", value: "Automática" },
    ],
    images: [],
    youtubeUrl: "",
  },
  {
    id: "es-013",
    name: "ESTEIRA DE ROLETES LIVRES 1M",
    category: "Esteira Transportadora",
    model: "RC1M",
    next: "PAMQESMA002",
    price: "Sob consulta",
    stockStatus: "in_stock",
    tags: ["Automático"],
    specifications: [
      { label: "Tipo de Produto", value: "Caixas, Outros" },
      { label: "Altura do Produto", value: "Ilimitado" },
      { label: "Largura do Rolete", value: "480 mm" },
      { label: "Comprimento", value: "1000 mm" },
      { label: "Velocidade", value: "15 m/min" },
      { label: "Tipo de Máquina", value: "Automática" },
    ],
    images: [],
    youtubeUrl: "",
  },
  {
    id: "es-014",
    name: "ESTEIRA TRANSPORTE DE CAIXA COM MOTOR (220V)",
    category: "Esteira Transportadora",
    model: "RC2M/D",
    next: "PAMQESAU001",
    price: "Sob consulta",
    stockStatus: "in_stock",
    tags: ["Automático"],
    specifications: [
      { label: "Tipo de Produto", value: "Caixas, Outros" },
      { label: "Altura do Produto", value: "Ilimitado" },
      { label: "Largura do Rolete", value: "480 mm" },
      { label: "Comprimento", value: "2000 mm" },
      { label: "Velocidade", value: "15 m/min" },
      { label: "Tipo de Máquina", value: "Automática" },
    ],
    images: [],
    youtubeUrl: "",
  },
  {
    id: "es-015",
    name: "ESTEIRA TRANSPORTE DE CAIXA",
    category: "Esteira Transportadora",
    model: "RC2M",
    next: "PAMQESMA003",
    price: "Sob consulta",
    stockStatus: "in_stock",
    tags: ["Automático"],
    specifications: [
      { label: "Tipo de Produto", value: "Caixas, Outros" },
      { label: "Altura do Produto", value: "Ilimitado" },
      { label: "Largura do Rolete", value: "480 mm" },
      { label: "Comprimento", value: "2000 mm" },
      { label: "Velocidade", value: "15 m/min" },
      { label: "Tipo de Máquina", value: "Automática" },
    ],
    images: [],
    youtubeUrl: "",
  },
  {
    id: "es-016",
    name: "ALIMENTADOR ELEVADOR DE PRODUTOS TIPO \"Z\"",
    category: "Esteira Transportadora",
    model: "ZC7200",
    next: "PAMQSLSA077",
    price: "Sob consulta",
    stockStatus: "in_stock",
    tags: ["Automático"],
    specifications: [
      { label: "Tipo de Produto", value: "Grãos" },
      { label: "Comprimento", value: "3500 mm" },
      { label: "Velocidade", value: "Volume de Transporte: 4.000-7.200 litros/h" },
      { label: "Altura do Elevador", value: "3200 mm" },
      { label: "Tipo de Máquina", value: "Automática" },
    ],
    images: [],
    youtubeUrl: "",
  },

  // ========== PRENSAS ROTATIVAS PARA COMPRIMIDOS ==========
  {
    id: "pr-001",
    name: "PRENSA AUTOMATICA ROTATIVA PARA COMPRIMIDOS",
    category: "Prensas Rotativas",
    model: "FS 10 P",
    next: "PAMQSLSA131",
    price: "Sob consulta",
    stockStatus: "in_stock",
    tags: ["Automático"],
    specifications: [
      { label: "Tipo de Produto", value: "Pós secos" },
      { label: "Tipo de Máquina", value: "Automática" },
    ],
    images: [],
    youtubeUrl: "",
  },
  {
    id: "pr-002",
    name: "PRENSA AUTOMATICA ROTATIVA PARA COMPRIMIDOS",
    category: "Prensas Rotativas",
    model: "FS 15 M",
    next: "PAMQSLSA022",
    price: "Sob consulta",
    stockStatus: "in_stock",
    tags: ["Automático"],
    specifications: [
      { label: "Tipo de Produto", value: "Pós secos" },
      { label: "Tamanho Máx. do Comprimido", value: "Ø25 mm" },
      { label: "Espessura Máx. do Comprimido", value: "6 mm" },
      { label: "Profundidade Máx. de Enchimento", value: "15 mm" },
      { label: "Produtividade", value: "27.000 comprimidos/hora" },
      { label: "Tipo de Máquina", value: "Automática" },
    ],
    images: [],
    youtubeUrl: "",
  },
  {
    id: "pr-003",
    name: "PRENSA ROTATIVA DE COMPRIMIDOS C/ SIST. ALIM. FORCADA",
    category: "Prensas Rotativas",
    model: "FS 17M(F)",
    next: "PAMQSLSA051",
    price: "Sob consulta",
    stockStatus: "in_stock",
    tags: ["Automático"],
    specifications: [
      { label: "Tipo de Produto", value: "Pós secos" },
      { label: "Tamanho Máx. do Comprimido", value: "Ø20 mm" },
      { label: "Espessura Máx. do Comprimido", value: "6 mm" },
      { label: "Profundidade Máx. de Enchimento", value: "15 mm" },
      { label: "Produtividade", value: "40.000 comprimidos/hora" },
      { label: "Tipo de Máquina", value: "Automática" },
    ],
    images: [],
    youtubeUrl: "",
  },
  {
    id: "pr-004",
    name: "COMPRESSORA PARA COMPRIMIDOS EFERVESCENTES",
    category: "Prensas Rotativas",
    model: "FS 23 GE PRO",
    next: "PAMQSLSA050",
    price: "Sob consulta",
    stockStatus: "in_stock",
    tags: ["Automático"],
    specifications: [
      { label: "Tipo de Produto", value: "Pós secos (Comprimidos Efervescentes)" },
      { label: "Tamanho Máx. do Comprimido", value: "Ø27 mm" },
      { label: "Espessura Máx. do Comprimido", value: "7 mm" },
      { label: "Profundidade Máx. de Enchimento", value: "17 mm" },
      { label: "Produtividade", value: "85.000 comprimidos/hora" },
      { label: "Tipo de Máquina", value: "Automática" },
    ],
    images: [],
    youtubeUrl: "",
  },
  {
    id: "pr-005",
    name: "PRENSA AUTOMATICA ROTATIVA PARA COMPRIMIDOS",
    category: "Prensas Rotativas",
    model: "FS 5 P",
    next: "PAMQSLSA029",
    price: "Sob consulta",
    stockStatus: "in_stock",
    tags: ["Automático"],
    specifications: [
      { label: "Tipo de Produto", value: "Pós secos" },
      { label: "Tamanho Máx. do Comprimido", value: "Ø13 mm" },
      { label: "Espessura Máx. do Comprimido", value: "6 mm" },
      { label: "Profundidade Máx. de Enchimento", value: "5 mm" },
      { label: "Produtividade", value: "9.600 comprimidos/hora" },
      { label: "Tipo de Máquina", value: "Automática" },
    ],
    images: [],
    youtubeUrl: "",
  },
  {
    id: "pr-006",
    name: "PRENSA AUTOMATICA ROTATIVA PARA COMPRIMIDOS",
    category: "Prensas Rotativas",
    model: "FS 9 P",
    next: "PAMQSLSA037",
    price: "Sob consulta",
    stockStatus: "in_stock",
    tags: ["Automático"],
    specifications: [
      { label: "Tipo de Produto", value: "Pós secos" },
      { label: "Tamanho Máx. do Comprimido", value: "Ø13 mm" },
      { label: "Espessura Máx. do Comprimido", value: "6 mm" },
      { label: "Profundidade Máx. de Enchimento", value: "15 mm" },
      { label: "Produtividade", value: "17.280 comprimidos/hora" },
      { label: "Tipo de Máquina", value: "Automática" },
    ],
    images: [],
    youtubeUrl: "",
  },
  {
    id: "pr-007",
    name: "PRENSA ROTATIVA AUT. P/ COMPRIMIDOS DUPLA COR",
    category: "Prensas Rotativas",
    model: "FS T420-31D",
    next: "PAMQSLSA031",
    price: "Sob consulta",
    stockStatus: "in_stock",
    tags: ["Automático"],
    specifications: [
      { label: "Tipo de Produto", value: "Pós secos (Comprimidos uma cor ou dupla cor)" },
      { label: "Tamanho Máx. do Comprimido", value: "Ø25 mm" },
      { label: "Espessura Máx. do Comprimido", value: "6 mm" },
      { label: "Profundidade Máx. de Enchimento", value: "15 mm" },
      { label: "Produtividade", value: "130.000 comp/h | 65.000 comp/h (dupla cor)" },
      { label: "Tipo de Máquina", value: "Automática" },
    ],
    images: [],
    youtubeUrl: "",
  },
  {
    id: "pr-008",
    name: "PRENSA ROTATIVA AUTOMATICA PARA COMPRIMIDOS",
    category: "Prensas Rotativas",
    model: "FS T420-31D",
    next: "PAMQSLSA030",
    price: "Sob consulta",
    stockStatus: "in_stock",
    tags: ["Automático"],
    specifications: [
      { label: "Tipo de Produto", value: "Pós secos" },
      { label: "Tamanho Máx. do Comprimido", value: "Ø25 mm" },
      { label: "Espessura Máx. do Comprimido", value: "6 mm" },
      { label: "Profundidade Máx. de Enchimento", value: "15 mm" },
      { label: "Produtividade", value: "130.000 comprimidos/hora" },
      { label: "Tipo de Máquina", value: "Automática" },
    ],
    images: [],
    youtubeUrl: "",
  },
  {
    id: "pr-009",
    name: "PRENSA ROTATIVA AUTOMATICA P/ COMPRIMIDOS P/ ALTA COMPACTACAO",
    category: "Prensas Rotativas",
    model: "FS420-29G",
    next: "PAMQSLSA127",
    price: "Sob consulta",
    stockStatus: "in_stock",
    tags: ["Automático"],
    specifications: [
      { label: "Tipo de Produto", value: "Pós secos" },
      { label: "Tamanho Máx. do Comprimido", value: "Ø20 mm" },
      { label: "Espessura Máx. do Comprimido", value: "12 mm" },
      { label: "Produtividade", value: "60.900 comprimidos/hora" },
      { label: "Tipo de Máquina", value: "Automática" },
    ],
    images: [],
    youtubeUrl: "",
  },
  {
    id: "pr-010",
    name: "PRENSA ROTATIVA AUTOMATICA P/ COMPRIMIDOS P/ ALTA COMPACTACAO",
    category: "Prensas Rotativas",
    model: "FS550-39G",
    next: "PAMQSLSA172",
    price: "Sob consulta",
    stockStatus: "in_stock",
    tags: ["Automático"],
    specifications: [
      { label: "Tipo de Produto", value: "Pós secos" },
      { label: "Tamanho Máx. do Comprimido", value: "Ø24,8 mm" },
      { label: "Espessura Máx. do Comprimido", value: "8 mm" },
      { label: "Profundidade Máx. de Enchimento", value: "18 mm" },
      { label: "Produtividade", value: "150.000 comprimidos/hora" },
      { label: "Tipo de Máquina", value: "Automática" },
    ],
    images: [],
    youtubeUrl: "",
  },
  {
    id: "pr-011",
    name: "POLIDORA E DESEMPOEIRADORA VERTICAL",
    category: "Prensas Rotativas",
    model: "UHTF230",
    next: "PAMQSLSA085",
    price: "Sob consulta",
    stockStatus: "in_stock",
    tags: ["Automático"],
    specifications: [
      { label: "Tipo de Produto", value: "Comprimidos" },
      { label: "Tamanho do Comprimido", value: "Ø3-Ø25 mm" },
      { label: "Produtividade", value: "800.000 comprimidos/hora" },
      { label: "Tipo de Máquina", value: "Automática" },
    ],
    images: [],
    youtubeUrl: "",
  },
  {
    id: "pr-012",
    name: "POLIDORA E DESEMPOEIRADORA DE COMPRIMIDOS",
    category: "Prensas Rotativas",
    model: "UHTF30",
    next: "PAMQSLSA097",
    price: "Sob consulta",
    stockStatus: "in_stock",
    tags: ["Automático"],
    specifications: [
      { label: "Tipo de Produto", value: "Comprimidos" },
      { label: "Tamanho do Comprimido", value: "Ø3-Ø10 mm" },
      { label: "Produtividade", value: "55.000 comprimidos/hora" },
      { label: "Tipo de Máquina", value: "Automática" },
    ],
    images: [],
    youtubeUrl: "",
  },

  // ========== ROTULADORAS SEMIAUTOMÁTICAS ==========
  {
    id: "ro-001",
    name: "ROTULADORA SEMI AUTOMATICA PARA FRASCOS PLANOS",
    category: "Rotuladoras",
    model: "MT150",
    next: "PAMQIPMN095",
    price: "Sob consulta",
    stockStatus: "in_stock",
    tags: [],
    specifications: [
      { label: "Tipo de Produto", value: "Rótulos" },
      { label: "Embalagem", value: "Frascos Planos" },
      { label: "Ø Int. Mín. Bobina", value: "Ø75 mm" },
      { label: "Ø Ext. Máx. Bobina", value: "Ø260 mm" },
      { label: "Comprimento do Rótulo", value: "30-150 mm" },
      { label: "Largura do Rótulo", value: "30-150 mm" },
      { label: "Dimensão da Embalagem", value: "C ilimitado × L 30-240 mm" },
      { label: "Produtividade", value: "até 30 frascos/min" },
      { label: "Tipo de Máquina", value: "Semiautomática" },
    ],
    images: [],
    youtubeUrl: "",
  },
  {
    id: "ro-002",
    name: "ROTULADORA ELETRICA MANUAL",
    category: "Rotuladoras",
    model: "MT50",
    next: "PAMQIPMN034",
    price: "Sob consulta",
    stockStatus: "in_stock",
    tags: ["Manual"],
    specifications: [
      { label: "Tipo de Produto", value: "Rótulos" },
      { label: "Embalagem", value: "Frascos Cilíndricos" },
      { label: "Ø Int. Mín. Bobina", value: "Ø70 mm" },
      { label: "Ø Ext. Máx. Bobina", value: "Ø250 mm" },
      { label: "Comprimento do Rótulo", value: "50-290 mm" },
      { label: "Largura do Rótulo", value: "50-150 mm" },
      { label: "Dimensão da Embalagem", value: "Ø18-Ø150 mm" },
      { label: "Produtividade", value: "até 30 frascos/min" },
      { label: "Tipo de Máquina", value: "Manual" },
    ],
    images: [],
    youtubeUrl: "",
  },
  {
    id: "ro-003",
    name: "ROTULADORA ELETRICA MANUAL COM DATADOR",
    category: "Rotuladoras",
    model: "MT50/P",
    next: "PAMQIPMN035",
    price: "Sob consulta",
    stockStatus: "in_stock",
    tags: ["Manual"],
    specifications: [
      { label: "Tipo de Produto", value: "Rótulos" },
      { label: "Embalagem", value: "Frascos Cilíndricos" },
      { label: "Ø Int. Mín. Bobina", value: "Ø70 mm" },
      { label: "Ø Ext. Máx. Bobina", value: "Ø250 mm" },
      { label: "Comprimento do Rótulo", value: "50-290 mm" },
      { label: "Largura do Rótulo", value: "50-150 mm" },
      { label: "Dimensão da Embalagem", value: "Ø18-Ø150 mm" },
      { label: "Produtividade", value: "até 30 frascos/min" },
      { label: "Tipo de Máquina", value: "Manual" },
    ],
    images: [],
    youtubeUrl: "",
  },
  {
    id: "ro-004",
    name: "ROTULADORA MANUAL P/ FRASCOS CILINDRICOS",
    category: "Rotuladoras",
    model: "RL30",
    next: "PAMQIPMN079",
    price: "Sob consulta",
    stockStatus: "in_stock",
    tags: ["Manual"],
    specifications: [
      { label: "Tipo de Produto", value: "Rótulos" },
      { label: "Embalagem", value: "Frascos Cilíndricos" },
      { label: "Ø Int. Mín. Bobina", value: "Ø75 mm" },
      { label: "Ø Ext. Máx. Bobina", value: "Ø180 mm" },
      { label: "Comprimento do Rótulo", value: "10-300 mm" },
      { label: "Largura do Rótulo", value: "10-110 mm" },
      { label: "Dimensão da Embalagem", value: "Ø15-Ø120 mm" },
      { label: "Produtividade", value: "até 30 frascos/min" },
      { label: "Tipo de Máquina", value: "Manual" },
    ],
    images: [],
    youtubeUrl: "",
  },
  {
    id: "ro-005",
    name: "ROTULADORA SEMI AUTOMATICA PARA LACRES",
    category: "Rotuladoras",
    model: "ALB512",
    next: "PAMQIPMN107",
    price: "Sob consulta",
    stockStatus: "in_stock",
    tags: [],
    specifications: [
      { label: "Tipo de Produto", value: "Rótulos Lacres" },
      { label: "Embalagem", value: "Caixas de Papelão" },
      { label: "Ø Int. Mín. Bobina", value: "Ø75 mm" },
      { label: "Ø Ext. Máx. Bobina", value: "Ø200 mm" },
      { label: "Comprimento do Rótulo", value: "45 mm" },
      { label: "Largura do Rótulo", value: "22 mm" },
      { label: "Dimensão da Embalagem", value: "C 45 × L 30 mm" },
      { label: "Produtividade", value: "até 90 frascos/min" },
      { label: "Tipo de Máquina", value: "Semiautomática" },
    ],
    images: [],
    youtubeUrl: "",
  },

  // ========== ROTULADORAS AUTOMÁTICAS ==========
  {
    id: "ro-006",
    name: "ROTULADORA AUTOM. PARA FRASCOS CILINDRICOS",
    category: "Rotuladoras",
    model: "ARLM-160B",
    next: "PAMQIPMN084",
    price: "Sob consulta",
    stockStatus: "in_stock",
    tags: ["Automático"],
    specifications: [
      { label: "Tipo de Produto", value: "Rótulos" },
      { label: "Embalagem", value: "Frascos Cilíndricos" },
      { label: "Ø Int. Mín. Bobina", value: "Ø75 mm" },
      { label: "Ø Ext. Máx. Bobina", value: "Ø260 mm" },
      { label: "Comprimento do Rótulo", value: "30-300 mm" },
      { label: "Largura do Rótulo", value: "20-100 mm" },
      { label: "Dimensão da Embalagem", value: "Ø30-Ø100 mm" },
      { label: "Produtividade", value: "600-1.800 frascos/hora" },
      { label: "Tipo de Máquina", value: "Automática" },
    ],
    images: [],
    youtubeUrl: "",
  },
  {
    id: "ro-007",
    name: "ROTULADORA AUTOM. LINEAR P/ FRASCOS CILINDRICOS",
    category: "Rotuladoras",
    model: "ARLM-200A",
    next: "PAMQIPMN082",
    price: "Sob consulta",
    stockStatus: "in_stock",
    tags: ["Automático"],
    specifications: [
      { label: "Tipo de Produto", value: "Rótulos" },
      { label: "Embalagem", value: "Frascos Cilíndricos" },
      { label: "Ø Int. Mín. Bobina", value: "Ø75 mm" },
      { label: "Ø Ext. Máx. Bobina", value: "Ø260 mm" },
      { label: "Comprimento do Rótulo", value: "30-180 mm" },
      { label: "Largura do Rótulo", value: "20-150 mm" },
      { label: "Dimensão da Embalagem", value: "Ø30-Ø120 × A 10-500 mm" },
      { label: "Produtividade", value: "600-3.000 frascos/hora" },
      { label: "Tipo de Máquina", value: "Automática" },
    ],
    images: [],
    youtubeUrl: "",
  },
  {
    id: "ro-008",
    name: "ROTULADORA AUTOM. LINEAR P/ FRASCOS CILINDRICOS",
    category: "Rotuladoras",
    model: "ARLM-200AII",
    next: "PAMQIPMN120",
    price: "Sob consulta",
    stockStatus: "in_stock",
    tags: ["Automático"],
    specifications: [
      { label: "Tipo de Produto", value: "Rótulos" },
      { label: "Embalagem", value: "Frascos Cilíndricos" },
      { label: "Ø Int. Mín. Bobina", value: "Ø76 mm" },
      { label: "Ø Ext. Máx. Bobina", value: "Ø200 mm" },
      { label: "Comprimento do Rótulo", value: "20-200 mm" },
      { label: "Largura do Rótulo", value: "10-110 mm" },
      { label: "Dimensão da Embalagem", value: "Ø20-Ø100 × A 30-300 mm" },
      { label: "Produtividade", value: "1.800-9.000 frascos/min" },
      { label: "Tipo de Máquina", value: "Automática" },
    ],
    images: [],
    youtubeUrl: "",
  },
  {
    id: "ro-009",
    name: "ROTULADORA AUTOM. PARA FRASCOS CILINDRICOS",
    category: "Rotuladoras",
    model: "ARLM-200B",
    next: "PAMQIPMN083",
    price: "Sob consulta",
    stockStatus: "in_stock",
    tags: ["Automático"],
    specifications: [
      { label: "Tipo de Produto", value: "Rótulos" },
      { label: "Embalagem", value: "Frascos Cilíndricos" },
      { label: "Ø Int. Mín. Bobina", value: "Ø75 mm" },
      { label: "Ø Ext. Máx. Bobina", value: "Ø260 mm" },
      { label: "Comprimento do Rótulo", value: "30-200 mm" },
      { label: "Largura do Rótulo", value: "20-150 mm" },
      { label: "Dimensão da Embalagem", value: "Ø30-Ø100 mm" },
      { label: "Produtividade", value: "600-1.800 frascos/hora" },
      { label: "Tipo de Máquina", value: "Automática" },
    ],
    images: [],
    youtubeUrl: "",
  },
  {
    id: "ro-010",
    name: "ROTULADORA AUTOM. DE MESA P/ FRASCOS CILINDRICOS",
    category: "Rotuladoras",
    model: "RBL100",
    next: "PAMQIPMN081",
    price: "Sob consulta",
    stockStatus: "in_stock",
    tags: ["Automático"],
    specifications: [
      { label: "Tipo de Produto", value: "Rótulos" },
      { label: "Embalagem", value: "Frascos Cilíndricos" },
      { label: "Ø Int. Mín. Bobina", value: "Ø75 mm" },
      { label: "Ø Ext. Máx. Bobina", value: "Ø250 mm" },
      { label: "Comprimento do Rótulo", value: "30-200 mm" },
      { label: "Largura do Rótulo", value: "30-100 mm" },
      { label: "Dimensão da Embalagem", value: "Ø30-Ø100 mm" },
      { label: "Produtividade", value: "600-1.800 frascos/hora" },
      { label: "Tipo de Máquina", value: "Automática" },
    ],
    images: [],
    youtubeUrl: "",
  },
  {
    id: "ro-011",
    name: "ROTULADORA AUTOM. DE MESA P/ FRASCOS CILINDRICOS",
    category: "Rotuladoras",
    model: "RBL100II",
    next: "PAMQIPMN123",
    price: "Sob consulta",
    stockStatus: "in_stock",
    tags: ["Automático"],
    specifications: [
      { label: "Tipo de Produto", value: "Rótulos" },
      { label: "Embalagem", value: "Frascos Cilíndricos" },
      { label: "Ø Int. Mín. Bobina", value: "Ø76 mm" },
      { label: "Ø Ext. Máx. Bobina", value: "Ø350 mm" },
      { label: "Comprimento do Rótulo", value: "10-300 mm" },
      { label: "Largura do Rótulo", value: "10-140 mm" },
      { label: "Dimensão da Embalagem", value: "Ø20-Ø110 mm" },
      { label: "Produtividade", value: "600-3.600 frascos/hora" },
      { label: "Tipo de Máquina", value: "Automática" },
    ],
    images: [],
    youtubeUrl: "",
  },
  {
    id: "ro-012",
    name: "ROTULADORA DE BANCADA PARA PRODUTOS PLANOS",
    category: "Rotuladoras",
    model: "RBL120",
    next: "PAMQIPMN092",
    price: "Sob consulta",
    stockStatus: "in_stock",
    tags: ["Automático"],
    specifications: [
      { label: "Tipo de Produto", value: "Rótulos" },
      { label: "Embalagem", value: "Frascos Cilíndricos" },
      { label: "Comprimento do Rótulo", value: "30-200 mm" },
      { label: "Largura do Rótulo", value: "30-100 mm" },
      { label: "Dimensão da Embalagem", value: "Ø30-Ø100 mm" },
      { label: "Produtividade", value: "600-2.400 frascos/hora" },
      { label: "Tipo de Máquina", value: "Automática" },
    ],
    images: [],
    youtubeUrl: "",
  },
  {
    id: "ro-013",
    name: "ROTULADORA AUTOM. DE MESA LINEAR P/ FRASCOS CILINDRICOS",
    category: "Rotuladoras",
    model: "RBL80",
    next: "PAMQIPMN080",
    price: "Sob consulta",
    stockStatus: "in_stock",
    tags: ["Automático"],
    specifications: [
      { label: "Tipo de Produto", value: "Rótulos" },
      { label: "Embalagem", value: "Frascos Cilíndricos" },
      { label: "Ø Int. Mín. Bobina", value: "Ø75 mm" },
      { label: "Ø Ext. Máx. Bobina", value: "Ø260 mm" },
      { label: "Comprimento do Rótulo", value: "30-160 mm" },
      { label: "Largura do Rótulo", value: "30-100 mm" },
      { label: "Dimensão da Embalagem", value: "Ø30-Ø100 mm" },
      { label: "Produtividade", value: "600-1.800 frascos/hora" },
      { label: "Tipo de Máquina", value: "Automática" },
    ],
    images: [],
    youtubeUrl: "",
  },
  {
    id: "ro-014",
    name: "ROTULADORA AUTOM. DE MESA LINEAR P/ FRASCOS CILINDRICOS",
    category: "Rotuladoras",
    model: "RBL80II",
    next: "PAMQIPMN122",
    price: "Sob consulta",
    stockStatus: "in_stock",
    tags: ["Automático"],
    specifications: [
      { label: "Tipo de Produto", value: "Rótulos" },
      { label: "Embalagem", value: "Frascos Cilíndricos" },
      { label: "Ø Int. Mín. Bobina", value: "Ø76 mm" },
      { label: "Comprimento do Rótulo", value: "20-200 mm" },
      { label: "Largura do Rótulo", value: "10-110 mm" },
      { label: "Dimensão da Embalagem", value: "Ø20-Ø100 × A 30-300 mm" },
      { label: "Produtividade", value: "600-3.000 frascos/hora" },
      { label: "Tipo de Máquina", value: "Automática" },
    ],
    images: [],
    youtubeUrl: "",
  },

  // ========== ROSQUEADORAS ==========
  {
    id: "rq-001",
    name: "ROSQUEADEIRA AUTOMATICA DE TAMPAS TIPO \"BICO DE PATO\"",
    category: "Rosqueadoras",
    model: "ADC50",
    next: "PAMQRSSA004",
    price: "Sob consulta",
    stockStatus: "in_stock",
    tags: ["Automático"],
    specifications: [
      { label: "Tipo de Produto", value: "Tampas Bico de Pato" },
      { label: "Embalagem", value: "Frascos" },
      { label: "Diâmetro da Tampa", value: "até Ø50 mm" },
      { label: "Diâmetro do Frasco", value: "Ø20-Ø100 mm" },
      { label: "Altura do Frasco", value: "50-320 mm" },
      { label: "Produtividade", value: "30-60 frascos/min" },
      { label: "Tipo de Máquina", value: "Automática" },
    ],
    images: [],
    youtubeUrl: "",
  },
  {
    id: "rq-002",
    name: "ROSQUEADEIRA AUT. DE BANCADA TIPO BICO DE PATO",
    category: "Rosqueadoras",
    model: "ADC50/M",
    next: "PAACSLAU414",
    price: "Sob consulta",
    stockStatus: "in_stock",
    tags: ["Automático"],
    specifications: [
      { label: "Tipo de Produto", value: "Tampas Bico de Pato" },
      { label: "Embalagem", value: "Frascos" },
      { label: "Diâmetro da Tampa", value: "Ø30-Ø60 mm" },
      { label: "Diâmetro do Frasco", value: "Ø40-Ø80 mm" },
      { label: "Altura do Frasco", value: "60-220 mm" },
      { label: "Produtividade", value: "15-20 frascos/min" },
      { label: "Tipo de Máquina", value: "Automática" },
    ],
    images: [],
    youtubeUrl: "",
  },
  {
    id: "rq-003",
    name: "ROSQUEADEIRA AUT. DE BANCADA TIPO BICO DE PATO",
    category: "Rosqueadoras",
    model: "ADC50/MII",
    next: "PAACSLAU523",
    price: "Sob consulta",
    stockStatus: "in_stock",
    tags: ["Automático"],
    specifications: [
      { label: "Tipo de Produto", value: "Tampas Bico de Pato" },
      { label: "Embalagem", value: "Frascos" },
      { label: "Diâmetro da Tampa", value: "Ø20-Ø50 mm" },
      { label: "Diâmetro do Frasco", value: "Ø30-Ø110 mm" },
      { label: "Altura do Frasco", value: "80-310 mm" },
      { label: "Produtividade", value: "10-30 frascos/min" },
      { label: "Tipo de Máquina", value: "Automática" },
    ],
    images: [],
    youtubeUrl: "",
  },
  {
    id: "rq-004",
    name: "ROSQUEADEIRA DE TAMPAS SEMI AUTOMATICA",
    category: "Rosqueadoras",
    model: "ADC50/SII",
    next: "PAMQRSSA029",
    price: "Sob consulta",
    stockStatus: "in_stock",
    tags: [],
    specifications: [
      { label: "Tipo de Produto", value: "Tampas Bico de Pato" },
      { label: "Embalagem", value: "Frascos" },
      { label: "Diâmetro da Tampa", value: "Ø20-Ø50 mm" },
      { label: "Diâmetro do Frasco", value: "Ø30-Ø110 mm" },
      { label: "Altura do Frasco", value: "80-310 mm" },
      { label: "Produtividade", value: "30-40 frascos/min" },
      { label: "Tipo de Máquina", value: "Semiautomática" },
    ],
    images: [],
    youtubeUrl: "",
  },
  {
    id: "rq-005",
    name: "ROSQUEADORA AUT. C/ ALIMENTACAO DE TAMPAS POR ESTEIRA",
    category: "Rosqueadoras",
    model: "ADC70",
    next: "PAMQRSSA033",
    price: "Sob consulta",
    stockStatus: "in_stock",
    tags: ["Automático"],
    specifications: [
      { label: "Tipo de Produto", value: "Tampas Bico de Pato" },
      { label: "Embalagem", value: "Frascos" },
      { label: "Diâmetro da Tampa", value: "Ø20-Ø50 mm" },
      { label: "Diâmetro do Frasco", value: "Ø20-Ø115 mm" },
      { label: "Altura do Frasco", value: "70-250 mm" },
      { label: "Produtividade", value: "25-60 frascos/min" },
      { label: "Tipo de Máquina", value: "Automática" },
    ],
    images: [],
    youtubeUrl: "",
  },
  {
    id: "rq-006",
    name: "ROSQUEADORA SEMI AUTOMATICA DE TAMPAS",
    category: "Rosqueadoras",
    model: "DHZ450A",
    next: "PAMQRSSA012",
    price: "Sob consulta",
    stockStatus: "in_stock",
    tags: [],
    specifications: [
      { label: "Embalagem", value: "Frascos" },
      { label: "Diâmetro da Tampa", value: "Ø30-Ø50 mm" },
      { label: "Altura do Frasco", value: "40-200 mm" },
      { label: "Produtividade", value: "30-45 frascos/min" },
      { label: "Tipo de Máquina", value: "Semiautomática" },
    ],
    images: [],
    youtubeUrl: "",
  },
  {
    id: "rq-007",
    name: "ROSQUEADORA SEMI AUTOMATICA DE TAMPAS",
    category: "Rosqueadoras",
    model: "DHZ450AII",
    next: "PAMQRSSA030",
    price: "Sob consulta",
    stockStatus: "in_stock",
    tags: [],
    specifications: [
      { label: "Embalagem", value: "Frascos" },
      { label: "Diâmetro da Tampa", value: "Ø10-Ø50 mm" },
      { label: "Diâmetro do Frasco", value: "Ø10-Ø50 mm" },
      { label: "Altura do Frasco", value: "50-350 mm" },
      { label: "Tipo de Máquina", value: "Semiautomática" },
    ],
    images: [],
    youtubeUrl: "",
  },
  {
    id: "rq-008",
    name: "ROSQUEADORA SEMI AUTOMATICA DE TAMPAS",
    category: "Rosqueadoras",
    model: "DHZ450B",
    next: "PAMQRSSA019",
    price: "Sob consulta",
    stockStatus: "in_stock",
    tags: [],
    specifications: [
      { label: "Embalagem", value: "Frascos" },
      { label: "Diâmetro da Tampa", value: "Ø50-Ø90 mm" },
      { label: "Altura do Frasco", value: "40-200 mm" },
      { label: "Produtividade", value: "30-45 frascos/min" },
      { label: "Tipo de Máquina", value: "Semiautomática" },
    ],
    images: [],
    youtubeUrl: "",
  },
  {
    id: "rq-009",
    name: "ROSQUEADORA SEMI AUTOMATICA DE TAMPAS",
    category: "Rosqueadoras",
    model: "DHZ450BII",
    next: "PAMQRSSA031",
    price: "Sob consulta",
    stockStatus: "in_stock",
    tags: [],
    specifications: [
      { label: "Embalagem", value: "Frascos" },
      { label: "Diâmetro da Tampa", value: "Ø20-Ø60 mm" },
      { label: "Altura do Frasco", value: "40-300 mm" },
      { label: "Produtividade", value: "15-20 frascos/min" },
      { label: "Tipo de Máquina", value: "Semiautomática" },
    ],
    images: [],
    youtubeUrl: "",
  },
  {
    id: "rq-010",
    name: "ROSQUEADORA BICO DE PATO SEMI AUTOMATICA DE TAMPAS",
    category: "Rosqueadoras",
    model: "DHZ550B",
    next: "PAMQRSSA018",
    price: "Sob consulta",
    stockStatus: "in_stock",
    tags: [],
    specifications: [
      { label: "Embalagem", value: "Frascos" },
      { label: "Diâmetro da Tampa", value: "Ø32-Ø80 mm" },
      { label: "Altura do Frasco", value: "32-300 mm" },
      { label: "Produtividade", value: "30-45 frascos/min" },
      { label: "Tipo de Máquina", value: "Semiautomática" },
    ],
    images: [],
    youtubeUrl: "",
  },
  {
    id: "rq-011",
    name: "ROSQUEADORA BICO DE PATO SEMI AUTOMATICA DE TAMPAS",
    category: "Rosqueadoras",
    model: "DHZ550BII",
    next: "PAMQRSSA032",
    price: "Sob consulta",
    stockStatus: "in_stock",
    tags: [],
    specifications: [
      { label: "Embalagem", value: "Frascos" },
      { label: "Diâmetro da Tampa", value: "Ø20-Ø50 mm" },
      { label: "Diâmetro do Frasco", value: "Ø110 mm" },
      { label: "Altura do Frasco", value: "50-300 mm" },
      { label: "Produtividade", value: "20-30 frascos/min" },
      { label: "Tipo de Máquina", value: "Semiautomática" },
    ],
    images: [],
    youtubeUrl: "",
  },
  {
    id: "rq-012",
    name: "ROSQUEADEIRA SEMI-AUTOM. P/ TAMPAS DE METAL",
    category: "Rosqueadoras",
    model: "DK-50D",
    next: "PAMQRSSA002",
    price: "Sob consulta",
    stockStatus: "in_stock",
    tags: [],
    specifications: [
      { label: "Tipo de Produto", value: "Tampas de Metal" },
      { label: "Embalagem", value: "Frascos" },
      { label: "Diâmetro da Tampa", value: "Ø25-Ø36 × A 7-35 mm" },
      { label: "Altura do Frasco", value: "50-300 mm" },
      { label: "Produtividade", value: "15-20 frascos/min" },
      { label: "Tipo de Máquina", value: "Semiautomática" },
    ],
    images: [],
    youtubeUrl: "",
  },
  {
    id: "rq-013",
    name: "ROSQUEADEIRA SEMI-AUTOM. P/ TAMPAS PLASTICAS",
    category: "Rosqueadoras",
    model: "DK-50Z",
    next: "PAMQRSSA001",
    price: "Sob consulta",
    stockStatus: "in_stock",
    tags: [],
    specifications: [
      { label: "Tipo de Produto", value: "Tampas de Plásticos" },
      { label: "Embalagem", value: "Frascos" },
      { label: "Diâmetro da Tampa", value: "Ø20-Ø40 × A 15-50 mm" },
      { label: "Diâmetro do Frasco", value: "Ø20-Ø90 mm" },
      { label: "Altura do Frasco", value: "200-320 mm" },
      { label: "Produtividade", value: "15-20 frascos/min" },
      { label: "Tipo de Máquina", value: "Semiautomática" },
    ],
    images: [],
    youtubeUrl: "",
  },
  {
    id: "rq-014",
    name: "ROSQUEADORA ELETRICA MANUAL",
    category: "Rosqueadoras",
    model: "EC80",
    next: "PAMQRSSA021",
    price: "Sob consulta",
    stockStatus: "in_stock",
    tags: ["Manual"],
    specifications: [
      { label: "Embalagem", value: "Frascos" },
      { label: "Diâmetro da Tampa", value: "Ø10-Ø50 mm" },
      { label: "Produtividade", value: "15-30 frascos/min" },
      { label: "Tipo de Máquina", value: "Manual" },
    ],
    images: [],
    youtubeUrl: "",
  },
  {
    id: "rq-015",
    name: "ROSQUEADEIRA ELETRICA MANUAL P/ TAMPAS (10MM~30MM)",
    category: "Rosqueadoras",
    model: "EC90",
    next: "PAMQRSSA005",
    price: "Sob consulta",
    stockStatus: "in_stock",
    tags: ["Manual"],
    specifications: [
      { label: "Embalagem", value: "Frascos" },
      { label: "Diâmetro da Tampa", value: "Ø10-Ø30 mm" },
      { label: "Produtividade", value: "30-90 frascos/min" },
      { label: "Tipo de Máquina", value: "Manual" },
    ],
    images: [],
    youtubeUrl: "",
  },
  {
    id: "rq-016",
    name: "ROSQUEADEIRA ELETRICA MANUAL P/ TAMPAS (10MM~40MM)",
    category: "Rosqueadoras",
    model: "EC90",
    next: "PAACRSMN019",
    price: "Sob consulta",
    stockStatus: "in_stock",
    tags: ["Manual"],
    specifications: [
      { label: "Embalagem", value: "Frascos" },
      { label: "Diâmetro da Tampa", value: "Ø10-Ø40 mm" },
      { label: "Produtividade", value: "30-90 frascos/min" },
      { label: "Tipo de Máquina", value: "Manual" },
    ],
    images: [],
    youtubeUrl: "",
  },
  {
    id: "rq-017",
    name: "ROSQUEADEIRA ELETRICA MANUAL P/ TAMPAS (10MM~50MM)",
    category: "Rosqueadoras",
    model: "EC90",
    next: "PAMQRSSA007",
    price: "Sob consulta",
    stockStatus: "in_stock",
    tags: ["Manual"],
    specifications: [
      { label: "Embalagem", value: "Frascos" },
      { label: "Diâmetro da Tampa", value: "Ø10-Ø50 mm" },
      { label: "Produtividade", value: "30-90 frascos/min" },
      { label: "Tipo de Máquina", value: "Manual" },
    ],
    images: [],
    youtubeUrl: "",
  },
  {
    id: "rq-018",
    name: "ROSQUEADEIRA ELETRICA MANUAL P/ TAMPAS (10MM~60MM)",
    category: "Rosqueadoras",
    model: "EC90",
    next: "PAACRSMN013",
    price: "Sob consulta",
    stockStatus: "in_stock",
    tags: ["Manual"],
    specifications: [
      { label: "Embalagem", value: "Frascos" },
      { label: "Diâmetro da Tampa", value: "Ø10-Ø60 mm" },
      { label: "Produtividade", value: "30-90 frascos/min" },
      { label: "Tipo de Máquina", value: "Manual" },
    ],
    images: [],
    youtubeUrl: "",
  },
  {
    id: "rq-019",
    name: "ROSQUEADEIRA PNEUMATICA MANUAL P/ TAMPAS (10MM~30MM)",
    category: "Rosqueadoras",
    model: "PC90",
    next: "PAMQRSSA006",
    price: "Sob consulta",
    stockStatus: "in_stock",
    tags: ["Manual"],
    specifications: [
      { label: "Embalagem", value: "Frascos" },
      { label: "Diâmetro da Tampa", value: "Ø10-Ø30 mm" },
      { label: "Produtividade", value: "30-90 frascos/min" },
      { label: "Tipo de Máquina", value: "Manual" },
    ],
    images: [],
    youtubeUrl: "",
  },
  {
    id: "rq-020",
    name: "ROSQUEADEIRA PNEUMATICA MANUAL P/ TAMPAS (10MM~40MM)",
    category: "Rosqueadoras",
    model: "PC90",
    next: "PAACRSMN017",
    price: "Sob consulta",
    stockStatus: "in_stock",
    tags: ["Manual"],
    specifications: [
      { label: "Embalagem", value: "Frascos" },
      { label: "Diâmetro da Tampa", value: "Ø10-Ø40 mm" },
      { label: "Produtividade", value: "30-90 frascos/min" },
      { label: "Tipo de Máquina", value: "Manual" },
    ],
    images: [],
    youtubeUrl: "",
  },
  {
    id: "rq-021",
    name: "ROSQUEADEIRA PNEUMATICA MANUAL P/ TAMPAS (10MM~50MM)",
    category: "Rosqueadoras",
    model: "PC90",
    next: "PAMQRSSA008",
    price: "Sob consulta",
    stockStatus: "in_stock",
    tags: ["Manual"],
    specifications: [
      { label: "Embalagem", value: "Frascos" },
      { label: "Diâmetro da Tampa", value: "Ø10-Ø50 mm" },
      { label: "Produtividade", value: "30-90 frascos/min" },
      { label: "Tipo de Máquina", value: "Manual" },
    ],
    images: [],
    youtubeUrl: "",
  },
  {
    id: "rq-022",
    name: "ROSQUEADEIRA PNEUMATICA MANUAL P/ TAMPAS (10MM~60MM)",
    category: "Rosqueadoras",
    model: "PC90",
    next: "PAACRSMN018",
    price: "Sob consulta",
    stockStatus: "in_stock",
    tags: ["Manual"],
    specifications: [
      { label: "Embalagem", value: "Frascos" },
      { label: "Diâmetro da Tampa", value: "Ø10-Ø60 mm" },
      { label: "Produtividade", value: "30-90 frascos/min" },
      { label: "Tipo de Máquina", value: "Manual" },
    ],
    images: [],
    youtubeUrl: "",
  },
  {
    id: "rq-023",
    name: "ROSQUEADEIRA AUTOMATICA DE ALTA VELOCIDADE C/ ELEVADOR",
    category: "Rosqueadoras",
    model: "XCG",
    next: "PAACSLAU351",
    price: "Sob consulta",
    stockStatus: "in_stock",
    tags: ["Automático"],
    specifications: [
      { label: "Embalagem", value: "Frascos" },
      { label: "Diâmetro da Tampa", value: "Ø20-Ø65 mm" },
      { label: "Diâmetro do Frasco", value: "Ø20-Ø120 mm" },
      { label: "Altura do Frasco", value: "45-150 mm" },
      { label: "Produtividade", value: "50-120 frascos/min" },
      { label: "Tipo de Máquina", value: "Automática" },
    ],
    images: [],
    youtubeUrl: "",
  },
  {
    id: "rq-024",
    name: "ROSQUEADEIRA AUTOMATICA C/ ELEVADOR AUTOM. DE TAMPAS",
    category: "Rosqueadoras",
    model: "XGG",
    next: "PAMQRSSA011",
    price: "Sob consulta",
    stockStatus: "in_stock",
    tags: ["Automático"],
    specifications: [
      { label: "Embalagem", value: "Frascos" },
      { label: "Diâmetro da Tampa", value: "Ø80-Ø120 mm" },
      { label: "Diâmetro do Frasco", value: "Ø120-Ø200 mm" },
      { label: "Produtividade", value: "20-25 frascos/min" },
      { label: "Tipo de Máquina", value: "Automática" },
    ],
    images: [],
    youtubeUrl: "",
  },
  {
    id: "rq-025",
    name: "ROSQUEADEIRA AUT. C/ SIST. INSERCAO SPOOM/SCOOP E APL. BATOQUE",
    category: "Rosqueadoras",
    model: "XTB",
    next: "PAMQRSSA013",
    price: "Sob consulta",
    stockStatus: "in_stock",
    tags: ["Automático"],
    specifications: [
      { label: "Embalagem", value: "Frascos" },
      { label: "Diâmetro do Frasco", value: "Ø23-Ø120 mm" },
      { label: "Altura do Frasco", value: "45-150 mm" },
      { label: "Produtividade", value: "25-80 frascos/min" },
      { label: "Tipo de Máquina", value: "Automática" },
    ],
    images: [],
    youtubeUrl: "",
  },
  {
    id: "rq-026",
    name: "ROSQUEADEIRA AUTOMATICA C/ SIST. ALIM. AUTOMATICA",
    category: "Rosqueadoras",
    model: "XTB/A",
    next: "PAMQRSSA014",
    price: "Sob consulta",
    stockStatus: "in_stock",
    tags: ["Automático"],
    specifications: [
      { label: "Embalagem", value: "Frascos" },
      { label: "Diâmetro da Tampa", value: "Ø30-Ø150 mm" },
      { label: "Produtividade", value: "15-20 frascos/min" },
      { label: "Tipo de Máquina", value: "Automática" },
    ],
    images: [],
    youtubeUrl: "",
  },

  // ========== TANQUE DE ENCOLHIMENTO ==========
  {
    id: "tq-001",
    name: "TANQUE DE ENCOLHIMENTO POR IMERSAO",
    category: "Tanques de Encolhimento",
    model: "HWS650",
    next: "PAMQSLSA032",
    price: "Sob consulta",
    stockStatus: "in_stock",
    tags: ["Automático"],
    specifications: [
      { label: "Tipo de Plástico", value: "Plásticos termoencolhíveis" },
      { label: "Material da Embalagem", value: "PVC/PP/POF/OUTROS" },
      { label: "Comprimento Máx. do Produto", value: "570 mm" },
      { label: "Largura Máx. do Produto", value: "420 mm" },
      { label: "Altura Máx. do Produto", value: "200 mm" },
      { label: "Peso Máx. de Carga", value: "50 kg" },
      { label: "Produtividade", value: "Depende do tempo de operação" },
      { label: "Tipo de Máquina", value: "Automática/Manual" },
    ],
    images: [],
    youtubeUrl: "",
  },

  // ========== MONTADORAS AUTOMÁTICAS DE CAIXAS ==========
  {
    id: "mc-001",
    name: "MONTADORA AUTOMATICA DE CAIXAS",
    category: "Montadoras",
    model: "CE16",
    next: "PAMQCCAU007",
    price: "Sob consulta",
    stockStatus: "in_stock",
    tags: ["Automático"],
    specifications: [
      { label: "Produto", value: "Caixa de Papelão Desmontada" },
      { label: "Tamanho Mín. da Caixa", value: "C 200 × L 200 × A 140 mm" },
      { label: "Tamanho Máx. da Caixa", value: "C 500 × L 400 × A 350 mm" },
      { label: "Produtividade", value: "6-15 caixas/min" },
      { label: "Tipo de Máquina", value: "Automática" },
    ],
    images: [],
    youtubeUrl: "",
  },
  {
    id: "mc-002",
    name: "MONTADORA DE CAIXAS C/ ALIM. PNEUMATICA",
    category: "Montadoras",
    model: "CES4035N/A",
    next: "PAMQCCAU008",
    price: "Sob consulta",
    stockStatus: "in_stock",
    tags: ["Automático"],
    specifications: [
      { label: "Produto", value: "Caixa de Papelão Desmontada" },
      { label: "Tamanho Mín. da Caixa", value: "C 200 × L 150 × A 100 mm" },
      { label: "Tamanho Máx. da Caixa", value: "C 500 × L 390 × A 350 mm" },
      { label: "Largura da Fita", value: "48, 60 ou 75 mm" },
      { label: "Produtividade", value: "10-14 caixas/min" },
      { label: "Tipo de Máquina", value: "Automática" },
    ],
    images: [],
    youtubeUrl: "",
  },
  {
    id: "mc-003",
    name: "MONTADORA AUTOMATICA DE CAIXAS DE PAPELAO",
    category: "Montadoras",
    model: "CES4530N",
    next: "PAMQCCAU004",
    price: "Sob consulta",
    stockStatus: "in_stock",
    tags: ["Automático"],
    specifications: [
      { label: "Produto", value: "Caixa de Papelão Desmontada" },
      { label: "Tamanho Mín. da Caixa", value: "C 200 × L 150 × A 100 mm" },
      { label: "Tamanho Máx. da Caixa", value: "C 500 × L 390 × A 350 mm" },
      { label: "Largura da Fita", value: "50, 60 ou 75 mm" },
      { label: "Produtividade", value: "10-14 caixas/min" },
      { label: "Tipo de Máquina", value: "Automática" },
    ],
    images: [],
    youtubeUrl: "",
  },
  {
    id: "mc-004",
    name: "MONTADORA AUTOMATICA DE CAIXAS DE PAPELAO",
    category: "Montadoras",
    model: "CES5040V/A",
    next: "PAMQCCAU023",
    price: "Sob consulta",
    stockStatus: "in_stock",
    tags: ["Automático"],
    specifications: [
      { label: "Produto", value: "Caixa de Papelão Desmontada" },
      { label: "Tipo de Máquina", value: "Automática" },
    ],
    images: [],
    youtubeUrl: "",
  },
  {
    id: "mc-005",
    name: "MONTADORA DE CAIXAS - CONJ. CE16+AS323 - AUTOMATICO",
    category: "Montadoras",
    model: "CE16+AS323",
    next: "PAMQCCAU011",
    price: "Sob consulta",
    stockStatus: "in_stock",
    tags: ["Automático"],
    specifications: [
      { label: "Produto", value: "Caixa de Papelão Desmontada" },
      { label: "Tamanho Mín. da Caixa", value: "C 200 × L 200 × A 140 mm" },
      { label: "Tamanho Máx. da Caixa", value: "C 500 × L 400 × A 350 mm" },
      { label: "Largura da Fita", value: "36, 48, 50 ou 60 mm" },
      { label: "Produtividade", value: "6-15 caixas/min" },
      { label: "Tipo de Máquina", value: "Automática" },
    ],
    images: [],
    youtubeUrl: "",
  },

  // ========== MONTADORA SEMIAUTOMÁTICA DE CAIXAS ==========
  {
    id: "mc-006",
    name: "FORMADORA DE FUNDO E SEL. PNEUM. CAIXAS DE PAPELAO (220V)",
    category: "Montadoras",
    model: "AS923B",
    next: "PAMQCCSA011",
    price: "Sob consulta",
    stockStatus: "in_stock",
    tags: [],
    specifications: [
      { label: "Tamanho Mín. da Caixa", value: "L 150 × A 120 mm" },
      { label: "Tamanho Máx. da Caixa", value: "C 500 × L 450 × A 570 mm" },
      { label: "Largura da Fita", value: "36, 48, 50 ou 60 mm" },
      { label: "Produtividade", value: "16 m/min" },
      { label: "Tipo de Máquina", value: "Semiautomática" },
    ],
    images: [],
    youtubeUrl: "",
  },

  // ========== MOINHOS TRITURADORES ==========
  {
    id: "mo-001",
    name: "MOINHO COLOIDAL",
    category: "Moinhos Trituradores",
    model: "MC50",
    next: "PAMQGPAU065",
    price: "Sob consulta",
    stockStatus: "in_stock",
    tags: [],
    specifications: [
      { label: "Tipo de Produto", value: "Pós e grãos" },
      { label: "Espessura do Produto", value: "2-50 μm" },
      { label: "Volume do Funil", value: "3 L" },
      { label: "Produtividade", value: "10-15 kg/h" },
      { label: "Tipo de Máquina", value: "Semiautomática" },
    ],
    images: [],
    youtubeUrl: "",
  },
  {
    id: "mo-002",
    name: "MOINHO COLOIDAL",
    category: "Moinhos Trituradores",
    model: "MC80",
    next: "PAMQGPAU066",
    price: "Sob consulta",
    stockStatus: "in_stock",
    tags: [],
    specifications: [
      { label: "Tipo de Produto", value: "Pós e grãos" },
      { label: "Espessura do Produto", value: "2-50 μm" },
      { label: "Volume do Funil", value: "8 L" },
      { label: "Produtividade", value: "50-70 kg/h" },
      { label: "Tipo de Máquina", value: "Semiautomática" },
    ],
    images: [],
    youtubeUrl: "",
  },

  // ========== MIXERS ROTATIVOS ==========
  {
    id: "mx-001",
    name: "MIXER MODELO \"V\" PARA 100 LITROS",
    category: "Mixers Rotativos",
    model: "MOTION V-100",
    next: "PAMQSLSA027",
    price: "Sob consulta",
    stockStatus: "in_stock",
    tags: ["Automático"],
    specifications: [
      { label: "Tipo de Produto", value: "Pós secos e Grânulos secos" },
      { label: "Volume", value: "100 L" },
      { label: "Produtividade", value: "A depender da receita" },
      { label: "Tipo de Máquina", value: "Automática" },
    ],
    images: [],
    youtubeUrl: "",
  },
  {
    id: "mx-002",
    name: "MIXER \"V\" 1000 LITROS (INOX 316L PARTES DE CONTATO)",
    category: "Mixers Rotativos",
    model: "MOTION V-1000",
    next: "PAMQSLSA130",
    price: "Sob consulta",
    stockStatus: "in_stock",
    tags: ["Automático"],
    specifications: [
      { label: "Tipo de Produto", value: "Pós secos e Grânulos secos" },
      { label: "Volume", value: "1000 L" },
      { label: "Produtividade", value: "A depender da receita" },
      { label: "Tipo de Máquina", value: "Automática" },
    ],
    images: [],
    youtubeUrl: "",
  },
  {
    id: "mx-003",
    name: "MIXER MODELO \"V\" PARA 15 LITROS",
    category: "Mixers Rotativos",
    model: "MOTION V-15",
    next: "PAMQSLSA036",
    price: "Sob consulta",
    stockStatus: "in_stock",
    tags: ["Automático"],
    specifications: [
      { label: "Tipo de Produto", value: "Pós secos e Grânulos secos" },
      { label: "Volume", value: "15 L" },
      { label: "Produtividade", value: "A depender da receita" },
      { label: "Tipo de Máquina", value: "Automática" },
    ],
    images: [],
    youtubeUrl: "",
  },
  {
    id: "mx-004",
    name: "MIXER MODELO \"V\" PARA 300 LITROS",
    category: "Mixers Rotativos",
    model: "MOTION V-300",
    next: "PAMQSLSA196",
    price: "Sob consulta",
    stockStatus: "in_stock",
    tags: ["Automático"],
    specifications: [
      { label: "Tipo de Produto", value: "Pós secos e Grânulos secos" },
      { label: "Volume", value: "300 L" },
      { label: "Produtividade", value: "A depender da receita" },
      { label: "Tipo de Máquina", value: "Automática" },
    ],
    images: [],
    youtubeUrl: "",
  },
  {
    id: "mx-005",
    name: "MIXER MODELO \"V\" PARA 500 LITROS",
    category: "Mixers Rotativos",
    model: "MOTION V-500",
    next: "PAMQSLSA086",
    price: "Sob consulta",
    stockStatus: "in_stock",
    tags: ["Automático"],
    specifications: [
      { label: "Tipo de Produto", value: "Pós secos e Grânulos secos" },
      { label: "Volume", value: "500 L" },
      { label: "Produtividade", value: "A depender da receita" },
      { label: "Tipo de Máquina", value: "Automática" },
    ],
    images: [],
    youtubeUrl: "",
  },
  {
    id: "mx-006",
    name: "TANQUE 500 LITROS C/ MIXER E SIST. DE VACUO P/ MISTURA HOMOGENIA",
    category: "Mixers Rotativos",
    model: "TANQUE 500L MIXER",
    next: "PAMQSLSA126",
    price: "Sob consulta",
    stockStatus: "in_stock",
    tags: ["Automático"],
    specifications: [
      { label: "Tipo de Produto", value: "Pastosos" },
      { label: "Volume", value: "500 L" },
      { label: "Produtividade", value: "A depender da receita" },
      { label: "Tipo de Máquina", value: "Automática" },
    ],
    images: [],
    youtubeUrl: "",
  },
  {
    id: "mx-007",
    name: "TANQUE REATOR ABERTO ENCAMISADO 50L C/ MIXER E CONTROLE DE INCLINACAO",
    category: "Mixers Rotativos",
    model: "TANQUE REATOR 50L",
    next: "PAMQSLSA099",
    price: "Sob consulta",
    stockStatus: "in_stock",
    tags: ["Automático"],
    specifications: [
      { label: "Tipo de Produto", value: "Pastosos" },
      { label: "Volume", value: "50 L" },
      { label: "Produtividade", value: "A depender da receita" },
      { label: "Tipo de Máquina", value: "Automática" },
    ],
    images: [],
    youtubeUrl: "",
  },

  // ========== FLOW PACK ==========
  {
    id: "fp-001",
    name: "FLOW PACK CONVENCIONAL",
    category: "Empacotadoras",
    model: "DXDZ-250B",
    next: "PAMQFPAU032",
    price: "Sob consulta",
    stockStatus: "in_stock",
    tags: ["Automático"],
    specifications: [
      { label: "Embalagem", value: "Embalagens Plásticas" },
      { label: "Material da Embalagem", value: "BOPP" },
      { label: "Comprimento da Embalagem", value: "65-190 / 120-280 mm" },
      { label: "Largura da Embalagem", value: "30-110 mm" },
      { label: "Altura Máx. do Produto", value: "40 mm" },
      { label: "Largura Máx. do Filme", value: "250 mm" },
      { label: "Ø Máx. Rolo de Filme", value: "Ø320 mm" },
      { label: "Produtividade", value: "40-230 embalagens/min" },
      { label: "Tipo de Máquina", value: "Automática" },
    ],
    images: [],
    youtubeUrl: "",
  },
  {
    id: "fp-002",
    name: "FLOW PACK INVERTIDA",
    category: "Empacotadoras",
    model: "DXDZ-250X",
    next: "PAMQFPAU033",
    price: "Sob consulta",
    stockStatus: "in_stock",
    tags: ["Automático"],
    specifications: [
      { label: "Embalagem", value: "Embalagens Plásticas" },
      { label: "Material da Embalagem", value: "BOPP" },
      { label: "Comprimento da Embalagem", value: "65-190 / 120-280 mm" },
      { label: "Largura da Embalagem", value: "30-110 mm" },
      { label: "Altura Máx. do Produto", value: "40 mm" },
      { label: "Largura Máx. do Filme", value: "250 mm" },
      { label: "Ø Máx. Rolo de Filme", value: "Ø320 mm" },
      { label: "Produtividade", value: "40-230 embalagens/min" },
      { label: "Tipo de Máquina", value: "Automática" },
    ],
    images: [],
    youtubeUrl: "",
  },

  // ========== SELADORAS MANUAIS ==========
  {
    id: "sl-001", name: "SELADORA MANUAL 100MM - PLASTICA C/ 05 UNID. (110V)", category: "Seladoras", model: "PCS100P", next: "PAMQSLMN064", price: "Sob consulta", stockStatus: "in_stock", tags: ["Manual"],
    specifications: [{ label: "Tipo de Produto", value: "Embalagens Plasticas/Filme" }, { label: "Material", value: "PP / PE" }, { label: "Largura de Selagem", value: "2 mm" }, { label: "Comprimento de Selagem", value: "100 mm" }, { label: "Tipo de Máquina", value: "Manual" }], images: [], youtubeUrl: "",
  },
  {
    id: "sl-002", name: "SELADORA MANUAL 100MM - PLASTICA C/ 10 UNID. (110V)", category: "Seladoras", model: "PCS100P", next: "PAMQSLMN065", price: "Sob consulta", stockStatus: "in_stock", tags: ["Manual"],
    specifications: [{ label: "Tipo de Produto", value: "Embalagens Plasticas/Filme" }, { label: "Material", value: "PP / PE" }, { label: "Largura de Selagem", value: "2 mm" }, { label: "Comprimento de Selagem", value: "100 mm" }, { label: "Tipo de Máquina", value: "Manual" }], images: [], youtubeUrl: "",
  },
  {
    id: "sl-003", name: "SELADORA MANUAL 100MM - PLASTICO (110V)", category: "Seladoras", model: "PCS100P", next: "PAMQSLMN013", price: "Sob consulta", stockStatus: "in_stock", tags: ["Manual"],
    specifications: [{ label: "Tipo de Produto", value: "Embalagens Plasticas/Filme" }, { label: "Material", value: "PP / PE" }, { label: "Largura de Selagem", value: "2 mm" }, { label: "Comprimento de Selagem", value: "100 mm" }, { label: "Tipo de Máquina", value: "Manual" }], images: [], youtubeUrl: "",
  },
  {
    id: "sl-004", name: "SELADORA MANUAL 100MM - PLASTICA C/ 05 UNID. (220V)", category: "Seladoras", model: "PCS100P", next: "PAMQSLMN066", price: "Sob consulta", stockStatus: "in_stock", tags: ["Manual"],
    specifications: [{ label: "Tipo de Produto", value: "Embalagens Plasticas/Filme" }, { label: "Material", value: "PP / PE" }, { label: "Largura de Selagem", value: "2 mm" }, { label: "Comprimento de Selagem", value: "100 mm" }, { label: "Tipo de Máquina", value: "Manual" }], images: [], youtubeUrl: "",
  },
  {
    id: "sl-005", name: "SELADORA MANUAL 100MM - PLASTICA C/ 10 UNID. (220V)", category: "Seladoras", model: "PCS100P", next: "PAMQSLMN067", price: "Sob consulta", stockStatus: "in_stock", tags: ["Manual"],
    specifications: [{ label: "Tipo de Produto", value: "Embalagens Plasticas/Filme" }, { label: "Material", value: "PP / PE" }, { label: "Largura de Selagem", value: "2 mm" }, { label: "Comprimento de Selagem", value: "100 mm" }, { label: "Tipo de Máquina", value: "Manual" }], images: [], youtubeUrl: "",
  },
  {
    id: "sl-006", name: "SELADORA MANUAL 100MM - PLASTICO (220V)", category: "Seladoras", model: "PCS100P", next: "PAMQSLMN014", price: "Sob consulta", stockStatus: "in_stock", tags: ["Manual"],
    specifications: [{ label: "Tipo de Produto", value: "Embalagens Plasticas/Filme" }, { label: "Material", value: "PP / PE" }, { label: "Largura de Selagem", value: "2 mm" }, { label: "Comprimento de Selagem", value: "100 mm" }, { label: "Tipo de Máquina", value: "Manual" }], images: [], youtubeUrl: "",
  },
  {
    id: "sl-007", name: "SELADORA MANUAL 200MM - ALUMINIO (110V)", category: "Seladoras", model: "PCS200A", next: "PAMQSLMN004", price: "Sob consulta", stockStatus: "in_stock", tags: ["Manual"],
    specifications: [{ label: "Tipo de Produto", value: "Embalagens Plasticas/Filme" }, { label: "Material", value: "PP / PE" }, { label: "Largura de Selagem", value: "2 mm" }, { label: "Comprimento de Selagem", value: "200 mm" }, { label: "Tipo de Máquina", value: "Manual" }], images: [], youtubeUrl: "",
  },
  {
    id: "sl-008", name: "SELADORA MANUAL 200MM - LATAO (110V)", category: "Seladoras", model: "PCS200I", next: "PAMQSLMN002", price: "Sob consulta", stockStatus: "in_stock", tags: ["Manual"],
    specifications: [{ label: "Tipo de Produto", value: "Embalagens Plasticas/Filme" }, { label: "Material", value: "PP / PE" }, { label: "Largura de Selagem", value: "2 mm" }, { label: "Comprimento de Selagem", value: "200 mm" }, { label: "Tipo de Máquina", value: "Manual" }], images: [], youtubeUrl: "",
  },
  {
    id: "sl-009", name: "SELADORA MANUAL 200MM - LATAO (220V)", category: "Seladoras", model: "PCS200I", next: "PAMQSLMN021", price: "Sob consulta", stockStatus: "in_stock", tags: ["Manual"],
    specifications: [{ label: "Tipo de Produto", value: "Embalagens Plasticas/Filme" }, { label: "Material", value: "PP / PE" }, { label: "Largura de Selagem", value: "2 mm" }, { label: "Comprimento de Selagem", value: "200 mm" }, { label: "Tipo de Máquina", value: "Manual" }], images: [], youtubeUrl: "",
  },
  {
    id: "sl-010", name: "SELADORA MANUAL C/ LAMINA DE CORTE (110V)", category: "Seladoras", model: "PCS200M", next: "PAMQSLMN016", price: "Sob consulta", stockStatus: "in_stock", tags: ["Manual"],
    specifications: [{ label: "Tipo de Produto", value: "Embalagens Plasticas/Filme" }, { label: "Material", value: "PP / PE" }, { label: "Largura de Selagem", value: "2 mm" }, { label: "Comprimento de Selagem", value: "200 mm" }, { label: "Tipo de Máquina", value: "Manual" }], images: [], youtubeUrl: "",
  },
  {
    id: "sl-011", name: "SELADORA MANUAL C/ LAMINA DE CORTE (220V)", category: "Seladoras", model: "PCS200M", next: "PAMQSLMN017", price: "Sob consulta", stockStatus: "in_stock", tags: ["Manual"],
    specifications: [{ label: "Tipo de Produto", value: "Embalagens Plasticas/Filme" }, { label: "Material", value: "PP / PE" }, { label: "Largura de Selagem", value: "2 mm" }, { label: "Comprimento de Selagem", value: "200 mm" }, { label: "Tipo de Máquina", value: "Manual" }], images: [], youtubeUrl: "",
  },
  {
    id: "sl-012", name: "SELADORA MANUAL 200MM - PLASTICA (110V)", category: "Seladoras", model: "PCS200P", next: "PAMQSLMN001", price: "Sob consulta", stockStatus: "in_stock", tags: ["Manual"],
    specifications: [{ label: "Tipo de Produto", value: "Embalagens Plasticas/Filme" }, { label: "Material", value: "PP / PE" }, { label: "Largura de Selagem", value: "2 mm" }, { label: "Comprimento de Selagem", value: "200 mm" }, { label: "Tipo de Máquina", value: "Manual" }], images: [], youtubeUrl: "",
  },
  {
    id: "sl-013", name: "SELADORA MANUAL 200MM - PLASTICA C/ 05 UNID. (110V)", category: "Seladoras", model: "PCS200P", next: "PAMQSLMN060", price: "Sob consulta", stockStatus: "in_stock", tags: ["Manual"],
    specifications: [{ label: "Tipo de Produto", value: "Embalagens Plasticas/Filme" }, { label: "Material", value: "PP / PE" }, { label: "Largura de Selagem", value: "2 mm" }, { label: "Comprimento de Selagem", value: "200 mm" }, { label: "Tipo de Máquina", value: "Manual" }], images: [], youtubeUrl: "",
  },
  {
    id: "sl-014", name: "SELADORA MANUAL 200MM - PLASTICA C/ 10 UNID. (110V)", category: "Seladoras", model: "PCS200P", next: "PAMQSLMN062", price: "Sob consulta", stockStatus: "in_stock", tags: ["Manual"],
    specifications: [{ label: "Tipo de Produto", value: "Embalagens Plasticas/Filme" }, { label: "Material", value: "PP / PE" }, { label: "Largura de Selagem", value: "2 mm" }, { label: "Comprimento de Selagem", value: "200 mm" }, { label: "Tipo de Máquina", value: "Manual" }], images: [], youtubeUrl: "",
  },
  {
    id: "sl-015", name: "SELADORA MANUAL 200MM - PLASTICA C/ 05 UNID. (220V)", category: "Seladoras", model: "PCS200P", next: "PAMQSLMN061", price: "Sob consulta", stockStatus: "in_stock", tags: ["Manual"],
    specifications: [{ label: "Tipo de Produto", value: "Embalagens Plasticas/Filme" }, { label: "Material", value: "PP / PE" }, { label: "Largura de Selagem", value: "2 mm" }, { label: "Comprimento de Selagem", value: "200 mm" }, { label: "Tipo de Máquina", value: "Manual" }], images: [], youtubeUrl: "",
  },
  {
    id: "sl-016", name: "SELADORA MANUAL 200MM - PLASTICA C/ 10 UNID. (220V)", category: "Seladoras", model: "PCS200P", next: "PAMQSLMN063", price: "Sob consulta", stockStatus: "in_stock", tags: ["Manual"],
    specifications: [{ label: "Tipo de Produto", value: "Embalagens Plasticas/Filme" }, { label: "Material", value: "PP / PE" }, { label: "Largura de Selagem", value: "2 mm" }, { label: "Comprimento de Selagem", value: "200 mm" }, { label: "Tipo de Máquina", value: "Manual" }], images: [], youtubeUrl: "",
  },
  {
    id: "sl-017", name: "SELADORA MANUAL 200MM - PLASTICO (220V)", category: "Seladoras", model: "PCS200P", next: "PAMQSLMN015", price: "Sob consulta", stockStatus: "in_stock", tags: ["Manual"],
    specifications: [{ label: "Tipo de Produto", value: "Embalagens Plasticas/Filme" }, { label: "Material", value: "PP / PE" }, { label: "Largura de Selagem", value: "2 mm" }, { label: "Comprimento de Selagem", value: "200 mm" }, { label: "Tipo de Máquina", value: "Manual" }], images: [], youtubeUrl: "",
  },
  {
    id: "sl-018", name: "SELADORA MANUAL 300MM ESTRT. ALUMINIO (110V)", category: "Seladoras", model: "PCS300A", next: "PAMQSLMN005", price: "Sob consulta", stockStatus: "in_stock", tags: ["Manual"],
    specifications: [{ label: "Tipo de Produto", value: "Embalagens Plasticas/Filme" }, { label: "Material", value: "PP / PE" }, { label: "Largura de Selagem", value: "2 mm" }, { label: "Comprimento de Selagem", value: "300 mm" }, { label: "Tipo de Máquina", value: "Manual" }], images: [], youtubeUrl: "",
  },
  {
    id: "sl-019", name: "SELADORA MANUAL 300MM ESTRT. ALUMINIO (220V)", category: "Seladoras", model: "PCS300A", next: "PAMQSLMN030", price: "Sob consulta", stockStatus: "in_stock", tags: ["Manual"],
    specifications: [{ label: "Tipo de Produto", value: "Embalagens Plasticas/Filme" }, { label: "Material", value: "PP / PE" }, { label: "Largura de Selagem", value: "2 mm" }, { label: "Comprimento de Selagem", value: "300 mm" }, { label: "Tipo de Máquina", value: "Manual" }], images: [], youtubeUrl: "",
  },
  {
    id: "sl-020", name: "SELADORA MANUAL 300MM - LATAO (110V)", category: "Seladoras", model: "PCS300I", next: "PAMQSLMN003", price: "Sob consulta", stockStatus: "in_stock", tags: ["Manual"],
    specifications: [{ label: "Tipo de Produto", value: "Embalagens Plasticas/Filme" }, { label: "Material", value: "PP / PE" }, { label: "Largura de Selagem", value: "2 mm" }, { label: "Comprimento de Selagem", value: "300 mm" }, { label: "Tipo de Máquina", value: "Manual" }], images: [], youtubeUrl: "",
  },
  {
    id: "sl-021", name: "SELADORA MANUAL 300MM - LATAO (220V)", category: "Seladoras", model: "PCS300I", next: "PAMQSLMN022", price: "Sob consulta", stockStatus: "in_stock", tags: ["Manual"],
    specifications: [{ label: "Tipo de Produto", value: "Embalagens Plasticas/Filme" }, { label: "Material", value: "PP / PE" }, { label: "Largura de Selagem", value: "2 mm" }, { label: "Comprimento de Selagem", value: "300 mm" }, { label: "Tipo de Máquina", value: "Manual" }], images: [], youtubeUrl: "",
  },
  {
    id: "sl-022", name: "SELADORA MANUAL 300MM C/ LAMINA DE CORTE (110V)", category: "Seladoras", model: "PCS300M", next: "PAMQSLMN018", price: "Sob consulta", stockStatus: "in_stock", tags: ["Manual"],
    specifications: [{ label: "Tipo de Produto", value: "Embalagens Plasticas/Filme" }, { label: "Material", value: "PP / PE" }, { label: "Largura de Selagem", value: "2 mm" }, { label: "Comprimento de Selagem", value: "300 mm" }, { label: "Tipo de Máquina", value: "Manual" }], images: [], youtubeUrl: "",
  },
  {
    id: "sl-023", name: "SELADORA MANUAL 300MM C/ LAMINA DE CORTE (220V)", category: "Seladoras", model: "PCS300M", next: "PAMQSLMN019", price: "Sob consulta", stockStatus: "in_stock", tags: ["Manual"],
    specifications: [{ label: "Tipo de Produto", value: "Embalagens Plasticas/Filme" }, { label: "Material", value: "PP / PE" }, { label: "Largura de Selagem", value: "2 mm" }, { label: "Comprimento de Selagem", value: "300 mm" }, { label: "Tipo de Máquina", value: "Manual" }], images: [], youtubeUrl: "",
  },
  {
    id: "sl-024", name: "SELADORA MANUAL 40CM - ALUMINIO (110V)", category: "Seladoras", model: "PCS400A", next: "PAMQSLMN023", price: "Sob consulta", stockStatus: "in_stock", tags: ["Manual"],
    specifications: [{ label: "Tipo de Produto", value: "Embalagens Plasticas/Filme" }, { label: "Material", value: "PP / PE" }, { label: "Largura de Selagem", value: "2 mm" }, { label: "Comprimento de Selagem", value: "400 mm" }, { label: "Tipo de Máquina", value: "Manual" }], images: [], youtubeUrl: "",
  },
  {
    id: "sl-025", name: "SELADORA MANUAL 40CM - ALUMINIO (220V)", category: "Seladoras", model: "PCS400A", next: "PAMQSLMN027", price: "Sob consulta", stockStatus: "in_stock", tags: ["Manual"],
    specifications: [{ label: "Tipo de Produto", value: "Embalagens Plasticas/Filme" }, { label: "Material", value: "PP / PE" }, { label: "Largura de Selagem", value: "2 mm" }, { label: "Comprimento de Selagem", value: "400 mm" }, { label: "Tipo de Máquina", value: "Manual" }], images: [], youtubeUrl: "",
  },
  {
    id: "sl-026", name: "SELADORA MANUAL 50CM - ALUMINIO (110V)", category: "Seladoras", model: "PCS500A", next: "PAMQSLMN028", price: "Sob consulta", stockStatus: "in_stock", tags: ["Manual"],
    specifications: [{ label: "Tipo de Produto", value: "Embalagens Plasticas/Filme" }, { label: "Material", value: "PP / PE" }, { label: "Largura de Selagem", value: "2 mm" }, { label: "Comprimento de Selagem", value: "500 mm" }, { label: "Tipo de Máquina", value: "Manual" }], images: [], youtubeUrl: "",
  },
  {
    id: "sl-027", name: "SELADORA MANUAL 50CM - ALUMINIO (220V)", category: "Seladoras", model: "PCS500A", next: "PAMQSCMN029", price: "Sob consulta", stockStatus: "in_stock", tags: ["Manual"],
    specifications: [{ label: "Tipo de Produto", value: "Embalagens Plasticas/Filme" }, { label: "Material", value: "PP / PE" }, { label: "Largura de Selagem", value: "2 mm" }, { label: "Comprimento de Selagem", value: "500 mm" }, { label: "Tipo de Máquina", value: "Manual" }], images: [], youtubeUrl: "",
  },

  // ========== SELADORA DE BANDEJA MANUAL ==========
  {
    id: "sl-028", name: "SELADORA PORTA PELICULA 450MM (220V)", category: "Seladoras", model: "HW-450", next: "PAMQVCSA001", price: "Sob consulta", stockStatus: "in_stock", tags: ["Manual"],
    specifications: [{ label: "Tipo de Produto", value: "Filme Alimentício" }, { label: "Material", value: "PE / PVC" }, { label: "Largura da Bobina", value: "452 mm" }, { label: "Área de Corte", value: "430 mm" }, { label: "Tipo de Máquina", value: "Manual" }], images: [], youtubeUrl: "",
  },

  // ========== SELADORA POR INDUÇÃO MANUAL ==========
  {
    id: "sl-029", name: "SELADORA MANUAL POR INDUCAO (220V)", category: "Seladoras", model: "DGYF500A", next: "PAMQSLSA006", price: "Sob consulta", stockStatus: "in_stock", tags: ["Manual"],
    specifications: [{ label: "Tipo de Produto", value: "Frascos Plásticos" }, { label: "Diâmetro de Selagem", value: "10-70 mm" }, { label: "Tipo de Máquina", value: "Manual" }], images: [], youtubeUrl: "",
  },
  {
    id: "sl-030", name: "SELADORA POR INDUCAO MANUAL", category: "Seladoras", model: "DGYF-S500C", next: "PAMQSLSA023", price: "Sob consulta", stockStatus: "in_stock", tags: ["Manual"],
    specifications: [{ label: "Tipo de Produto", value: "Frascos Plásticos" }, { label: "Diâmetro de Selagem", value: "60-130 mm" }, { label: "Tipo de Máquina", value: "Manual" }], images: [], youtubeUrl: "",
  },

  // ========== SELADORA POR INDUÇÃO AUTOMÁTICA ==========
  {
    id: "sl-031", name: "SELADORA CONTINUA POR INDUCAO - ACO PINTADO (220V)", category: "Seladoras", model: "FL1500A", next: "PAMQSLSA019", price: "Sob consulta", stockStatus: "in_stock", tags: ["Automático"],
    specifications: [{ label: "Tipo de Produto", value: "Frascos Plásticos" }, { label: "Produtividade", value: "0-10 m/min" }, { label: "Diâmetro de Selagem", value: "Ø20-50 mm" }, { label: "Altura do Produto", value: "40-200 mm" }, { label: "Tipo de Máquina", value: "Automática" }], images: [], youtubeUrl: "",
  },
  {
    id: "sl-032", name: "SELADORA POR INDUCAO ACO INOX (220V)", category: "Seladoras", model: "FL1500S", next: "PAMQSLSA001", price: "Sob consulta", stockStatus: "in_stock", tags: ["Automático"],
    specifications: [{ label: "Tipo de Produto", value: "Frascos Plásticos" }, { label: "Produtividade", value: "0-10 m/min" }, { label: "Diâmetro de Selagem", value: "Ø20-50 mm" }, { label: "Altura do Produto", value: "40-200 mm" }, { label: "Tipo de Máquina", value: "Automática" }], images: [], youtubeUrl: "",
  },
  {
    id: "sl-033", name: "SELADORA POR INDUCAO (220V) PINTADA", category: "Seladoras", model: "FL2000A", next: "PAMQSLSA068", price: "Sob consulta", stockStatus: "in_stock", tags: ["Automático"],
    specifications: [{ label: "Tipo de Produto", value: "Frascos Plásticos" }, { label: "Produtividade", value: "2-12 m/min" }, { label: "Diâmetro de Selagem", value: "Ø20-130 mm" }, { label: "Altura do Produto", value: "40-300 mm" }, { label: "Tipo de Máquina", value: "Automática" }], images: [], youtubeUrl: "",
  },
  {
    id: "sl-034", name: "SELADORA POR INDUCAO MODELO DE PISO (220V)", category: "Seladoras", model: "FL2000B", next: "PAMQSLSA069", price: "Sob consulta", stockStatus: "in_stock", tags: ["Automático"],
    specifications: [{ label: "Tipo de Produto", value: "Frascos Plásticos" }, { label: "Produtividade", value: "2-12 m/min" }, { label: "Diâmetro de Selagem", value: "Ø40-390 mm" }, { label: "Altura do Produto", value: "40-200 mm" }, { label: "Tipo de Máquina", value: "Automática" }], images: [], youtubeUrl: "",
  },
  {
    id: "sl-035", name: "SELADORA POR INDUCAO ACO INOX (220V)", category: "Seladoras", model: "FL2000S", next: "PAMQSLSA052", price: "Sob consulta", stockStatus: "in_stock", tags: ["Automático"],
    specifications: [{ label: "Tipo de Produto", value: "Frascos Plásticos" }, { label: "Produtividade", value: "2-12 m/min" }, { label: "Diâmetro de Selagem", value: "Ø20-130 mm" }, { label: "Altura do Produto", value: "40-200 mm" }, { label: "Tipo de Máquina", value: "Automática" }], images: [], youtubeUrl: "",
  },
  {
    id: "sl-036", name: "SELADORA DE INDUCAO REFRIGERADA A AGUA", category: "Seladoras", model: "FL3000A", next: "PAMQSLAU081", price: "Sob consulta", stockStatus: "in_stock", tags: ["Automático"],
    specifications: [{ label: "Tipo de Produto", value: "Frascos Plásticos" }, { label: "Produtividade", value: "0-300 frascos/min" }, { label: "Diâmetro de Selagem", value: "Ø15-120 mm" }, { label: "Altura do Produto", value: "50-260 mm" }, { label: "Tipo de Máquina", value: "Automática" }], images: [], youtubeUrl: "",
  },

  // ========== SELADORA BUNDLING ==========
  {
    id: "sl-037", name: "SELADORA BUNDLING SEMI-AUT. CONJUGADA COM TUNEL 220V/60HZ/3F", category: "Seladoras", model: "BSF-6540XLT", next: "PAMQCCSA028", price: "Sob consulta", stockStatus: "in_stock", tags: ["Automático"],
    specifications: [{ label: "Tipo de Embalagem", value: "Filme Termoencolhível (Plásticos Poliolefínicos)" }, { label: "Material do Filme", value: "PE / PVC / outros" }, { label: "Largura Máx. do Filme", value: "600 mm" }, { label: "Produtividade", value: "8-10 pcs/min" }, { label: "Tamanho Máx.", value: "C 520 × L 320 × A 350 mm" }, { label: "Tipo de Máquina", value: "Automática" }], images: [], youtubeUrl: "",
  },

  // ========== SELADORAS DE PEDAL ==========
  {
    id: "sp-001", name: "SELADORA DE PEDAL 30CM (110V)", category: "Seladoras", model: "FRP300", next: "PAMQSLPE001", price: "Sob consulta", stockStatus: "in_stock", tags: ["Manual"],
    specifications: [{ label: "Tipo de Embalagem", value: "Embalagens Plasticas/Filme" }, { label: "Comprimento de Selagem", value: "300 mm" }, { label: "Largura de Selagem", value: "2 mm" }, { label: "Tipo de Máquina", value: "Manual" }], images: [], youtubeUrl: "",
  },
  {
    id: "sp-002", name: "SELADORA DE PEDAL 30CM (220V)", category: "Seladoras", model: "FRP300", next: "PAMQSLPE007", price: "Sob consulta", stockStatus: "in_stock", tags: ["Manual"],
    specifications: [{ label: "Tipo de Embalagem", value: "Embalagens Plasticas/Filme" }, { label: "Comprimento de Selagem", value: "300 mm" }, { label: "Largura de Selagem", value: "2 mm" }, { label: "Tipo de Máquina", value: "Manual" }], images: [], youtubeUrl: "",
  },
  {
    id: "sp-003", name: "SELADORA DE PEDAL 40CM (110V)", category: "Seladoras", model: "FRP400", next: "PAMQSLPE002", price: "Sob consulta", stockStatus: "in_stock", tags: ["Manual"],
    specifications: [{ label: "Tipo de Embalagem", value: "Embalagens Plasticas/Filme" }, { label: "Comprimento de Selagem", value: "400 mm" }, { label: "Largura de Selagem", value: "2 mm" }, { label: "Tipo de Máquina", value: "Manual" }], images: [], youtubeUrl: "",
  },
  {
    id: "sp-004", name: "SELADORA DE PEDAL 40CM (220V)", category: "Seladoras", model: "FRP400", next: "PAMQSLPE006", price: "Sob consulta", stockStatus: "in_stock", tags: ["Manual"],
    specifications: [{ label: "Tipo de Embalagem", value: "Embalagens Plasticas/Filme" }, { label: "Comprimento de Selagem", value: "400 mm" }, { label: "Largura de Selagem", value: "2 mm" }, { label: "Tipo de Máquina", value: "Manual" }], images: [], youtubeUrl: "",
  },
  {
    id: "sp-005", name: "SELADORA DE SACOS PLAST. DE PEDAL 30CM (110V)", category: "Seladoras", model: "FRP400T", next: "PAMQSLPE004", price: "Sob consulta", stockStatus: "in_stock", tags: ["Manual"],
    specifications: [{ label: "Tipo de Embalagem", value: "Embalagens Plasticas/Filme" }, { label: "Comprimento de Selagem", value: "400 mm" }, { label: "Largura de Selagem", value: "2 mm" }, { label: "Tipo de Máquina", value: "Manual" }], images: [], youtubeUrl: "",
  },
  {
    id: "sp-006", name: "SELADORA DE PEDAL 50CM (110V)", category: "Seladoras", model: "FRP500", next: "PAMQSLPE008", price: "Sob consulta", stockStatus: "in_stock", tags: ["Manual"],
    specifications: [{ label: "Tipo de Embalagem", value: "Embalagens Plasticas/Filme" }, { label: "Comprimento de Selagem", value: "500 mm" }, { label: "Largura de Selagem", value: "2 mm" }, { label: "Tipo de Máquina", value: "Manual" }], images: [], youtubeUrl: "",
  },
  {
    id: "sp-007", name: "SELADORA DE PEDAL 50CM (220V)", category: "Seladoras", model: "FRP500", next: "PAMQSLPE003", price: "Sob consulta", stockStatus: "in_stock", tags: ["Manual"],
    specifications: [{ label: "Tipo de Embalagem", value: "Embalagens Plasticas/Filme" }, { label: "Comprimento de Selagem", value: "500 mm" }, { label: "Largura de Selagem", value: "2 mm" }, { label: "Tipo de Máquina", value: "Manual" }], images: [], youtubeUrl: "",
  },
  {
    id: "sp-008", name: "SELADORA DE PEDAL 60CM (220V)", category: "Seladoras", model: "FRP600", next: "PAMQSLPE016", price: "Sob consulta", stockStatus: "in_stock", tags: ["Manual"],
    specifications: [{ label: "Tipo de Embalagem", value: "Embalagens Plasticas/Filme" }, { label: "Comprimento de Selagem", value: "600 mm" }, { label: "Largura de Selagem", value: "2 mm" }, { label: "Tipo de Máquina", value: "Manual" }], images: [], youtubeUrl: "",
  },
  {
    id: "sp-009", name: "SELADORA DE SACOS PLAST. DE PEDAL 60CM (110V)", category: "Seladoras", model: "FRP600T", next: "PAMQSLPE009", price: "Sob consulta", stockStatus: "in_stock", tags: ["Manual"],
    specifications: [{ label: "Tipo de Embalagem", value: "Embalagens Plasticas/Filme" }, { label: "Comprimento de Selagem", value: "600 mm" }, { label: "Largura de Selagem", value: "2 mm" }, { label: "Tipo de Máquina", value: "Manual" }], images: [], youtubeUrl: "",
  },
  {
    id: "sp-010", name: "SELADORA DE SACOS PLAST. DE PEDAL 60CM (220V)", category: "Seladoras", model: "FRP600T", next: "PAMQSLPE005", price: "Sob consulta", stockStatus: "in_stock", tags: ["Manual"],
    specifications: [{ label: "Tipo de Embalagem", value: "Embalagens Plasticas/Filme" }, { label: "Comprimento de Selagem", value: "600 mm" }, { label: "Largura de Selagem", value: "2 mm" }, { label: "Tipo de Máquina", value: "Manual" }], images: [], youtubeUrl: "",
  },
  {
    id: "sp-011", name: "SELADORA DE PEDAL 70CM (110V)", category: "Seladoras", model: "FRP700", next: "PAMQSLPE011", price: "Sob consulta", stockStatus: "in_stock", tags: ["Manual"],
    specifications: [{ label: "Tipo de Embalagem", value: "Embalagens Plasticas/Filme" }, { label: "Comprimento de Selagem", value: "700 mm" }, { label: "Largura de Selagem", value: "2 mm" }, { label: "Tipo de Máquina", value: "Manual" }], images: [], youtubeUrl: "",
  },
  {
    id: "sp-012", name: "SELADORA DE PEDAL 70CM (220V)", category: "Seladoras", model: "FRP700", next: "PAMQSLPE010", price: "Sob consulta", stockStatus: "in_stock", tags: ["Manual"],
    specifications: [{ label: "Tipo de Embalagem", value: "Embalagens Plasticas/Filme" }, { label: "Comprimento de Selagem", value: "700 mm" }, { label: "Largura de Selagem", value: "2 mm" }, { label: "Tipo de Máquina", value: "Manual" }], images: [], youtubeUrl: "",
  },
  {
    id: "sp-013", name: "SELADORA DE PEDAL 80CM (110V)", category: "Seladoras", model: "FRP800", next: "PAMQSLPE012", price: "Sob consulta", stockStatus: "in_stock", tags: ["Manual"],
    specifications: [{ label: "Tipo de Embalagem", value: "Embalagens Plasticas/Filme" }, { label: "Comprimento de Selagem", value: "800 mm" }, { label: "Largura de Selagem", value: "2 mm" }, { label: "Tipo de Máquina", value: "Manual" }], images: [], youtubeUrl: "",
  },
  {
    id: "sp-014", name: "SELADORA DE PEDAL 80CM (220V)", category: "Seladoras", model: "FRP800", next: "PAMQSLPE013", price: "Sob consulta", stockStatus: "in_stock", tags: ["Manual"],
    specifications: [{ label: "Tipo de Embalagem", value: "Embalagens Plasticas/Filme" }, { label: "Comprimento de Selagem", value: "800 mm" }, { label: "Largura de Selagem", value: "2 mm" }, { label: "Tipo de Máquina", value: "Manual" }], images: [], youtubeUrl: "",
  },
  {
    id: "sp-015", name: "SELADORA DE PEDAL 90CM (110V)", category: "Seladoras", model: "FRP900", next: "PAMQSLPE015", price: "Sob consulta", stockStatus: "in_stock", tags: ["Manual"],
    specifications: [{ label: "Tipo de Embalagem", value: "Embalagens Plasticas/Filme" }, { label: "Comprimento de Selagem", value: "900 mm" }, { label: "Largura de Selagem", value: "2 mm" }, { label: "Tipo de Máquina", value: "Manual" }], images: [], youtubeUrl: "",
  },
  {
    id: "sp-016", name: "SELADORA DE PEDAL 90CM (220V)", category: "Seladoras", model: "FRP900", next: "PAMQSLPE014", price: "Sob consulta", stockStatus: "in_stock", tags: ["Manual"],
    specifications: [{ label: "Tipo de Embalagem", value: "Embalagens Plasticas/Filme" }, { label: "Comprimento de Selagem", value: "900 mm" }, { label: "Largura de Selagem", value: "2 mm" }, { label: "Tipo de Máquina", value: "Manual" }], images: [], youtubeUrl: "",
  },
  {
    id: "sp-017", name: "SELADORA DE PEDAL (110V)", category: "Seladoras", model: "FRP1000", next: "PAMQSLPE017", price: "Sob consulta", stockStatus: "in_stock", tags: ["Manual"],
    specifications: [{ label: "Tipo de Embalagem", value: "Embalagens Plasticas/Filme" }, { label: "Comprimento de Selagem", value: "1000 mm" }, { label: "Largura de Selagem", value: "2 mm" }, { label: "Tipo de Máquina", value: "Manual" }], images: [], youtubeUrl: "",
  },
  {
    id: "sp-018", name: "SELADORA DE PEDAL (220V)", category: "Seladoras", model: "FRP1000", next: "PAMQSLPE018", price: "Sob consulta", stockStatus: "in_stock", tags: ["Manual"],
    specifications: [{ label: "Tipo de Embalagem", value: "Embalagens Plasticas/Filme" }, { label: "Comprimento de Selagem", value: "1000 mm" }, { label: "Largura de Selagem", value: "2 mm" }, { label: "Tipo de Máquina", value: "Manual" }], images: [], youtubeUrl: "",
  },
  {
    id: "sp-019", name: "SELADORA PNEUMATICA PARA SACOS PESADOS", category: "Seladoras", model: "SP600L", next: "PAMQSLAU080", price: "Sob consulta", stockStatus: "in_stock", tags: [],
    specifications: [{ label: "Tipo de Embalagem", value: "Embalagens plásticas" }, { label: "Comprimento de Selagem", value: "600 mm" }, { label: "Largura de Selagem", value: "10 mm" }, { label: "Comprimento da Embalagem", value: "150-800 mm" }, { label: "Tipo de Máquina", value: "Semiautomática" }], images: [], youtubeUrl: "",
  },

  // ========== SELADORAS EM "L" ==========
  {
    id: "sll-001", name: "SELADORA EM L AUTOMATICA", category: "Seladoras", model: "ASS5640", next: "PAMQSLAU150", price: "Sob consulta", stockStatus: "in_stock", tags: ["Automático"],
    specifications: [{ label: "Material do Filme", value: "POF / PVC / outros" }, { label: "Largura Máx. Bobina", value: "550 mm" }, { label: "Produtividade", value: "30 peças/min" }, { label: "Comprimento Emb.", value: "50-400 mm" }, { label: "Largura Emb.", value: "30-350 mm" }, { label: "Altura Emb.", value: "130 mm" }, { label: "Tipo de Máquina", value: "Automática" }], images: [], youtubeUrl: "",
  },
  {
    id: "sll-002", name: "SELADORA TIPO L C/ SELAGEM LAT. CONT. E FECH. HORIZONTAL", category: "Seladoras", model: "BF650", next: "PAMQSLAU040", price: "Sob consulta", stockStatus: "in_stock", tags: ["Automático"],
    specifications: [{ label: "Material do Filme", value: "POF / PVC / outros" }, { label: "Largura Máx. Bobina", value: "600 mm" }, { label: "Produtividade", value: "15 m/min" }, { label: "Comprimento Emb.", value: "Ilimitado" }, { label: "Largura Emb.", value: "650 mm" }, { label: "Altura Emb.", value: "200 mm" }, { label: "Tipo de Máquina", value: "Automática" }], images: [], youtubeUrl: "",
  },
  {
    id: "sll-003", name: "SELADORA TIPO L C/ SELAGEM LAT. CONT. E FECH. HORIZONTAL", category: "Seladoras", model: "BF850", next: "PAMQSLAU052", price: "Sob consulta", stockStatus: "in_stock", tags: ["Automático"],
    specifications: [{ label: "Material do Filme", value: "POF / PVC / outros" }, { label: "Largura Máx. Bobina", value: "800 mm" }, { label: "Produtividade", value: "15 m/min" }, { label: "Comprimento Emb.", value: "Ilimitado" }, { label: "Largura Emb.", value: "850 mm" }, { label: "Altura Emb.", value: "200 mm" }, { label: "Tipo de Máquina", value: "Automática" }], images: [], youtubeUrl: "",
  },
  {
    id: "sll-004", name: "SELADORA TIPO L C/ SELAGEM LAT. CONT. E FECH. HORIZONTAL", category: "Seladoras", model: "BF850/25", next: "PAMQSLAU196", price: "Sob consulta", stockStatus: "in_stock", tags: ["Automático"],
    specifications: [{ label: "Material do Filme", value: "POF / PVC / outros" }, { label: "Largura Máx. Bobina", value: "800 mm" }, { label: "Produtividade", value: "15 m/min" }, { label: "Comprimento Emb.", value: "Ilimitado" }, { label: "Largura Emb.", value: "850 mm" }, { label: "Altura Emb.", value: "250 mm" }, { label: "Tipo de Máquina", value: "Automática" }], images: [], youtubeUrl: "",
  },
  {
    id: "sll-005", name: "SELADORA TIPO L - SELAGEM LATERAL CONTINUA 220V/1F", category: "Seladoras", model: "BSF-5545LE", next: "PAMQSLAU048", price: "Sob consulta", stockStatus: "in_stock", tags: ["Automático"],
    specifications: [{ label: "Material do Filme", value: "POF / PVC / outros" }, { label: "Largura Máx. Bobina", value: "550 mm" }, { label: "Produtividade", value: "25 peças/min" }, { label: "Comprimento Emb.", value: "Ilimitado" }, { label: "Largura Emb.", value: "350 mm" }, { label: "Altura Emb.", value: "150 mm" }, { label: "Tipo de Máquina", value: "Automática" }], images: [], youtubeUrl: "",
  },
  {
    id: "sll-006", name: "SELADORA L AUTOMATICA (220V)", category: "Seladoras", model: "BSF-5640LG-E", next: "PAMQSLAU076", price: "Sob consulta", stockStatus: "in_stock", tags: ["Automático"],
    specifications: [{ label: "Material do Filme", value: "POF / PVC / outros" }, { label: "Largura Máx. Bobina", value: "550 mm" }, { label: "Produtividade", value: "25 peças/min" }, { label: "Comprimento Emb.", value: "400 mm" }, { label: "Largura Emb.", value: "350 mm" }, { label: "Altura Emb.", value: "150 mm" }, { label: "Tipo de Máquina", value: "Automática" }], images: [], youtubeUrl: "",
  },
  {
    id: "sll-007", name: "SELADORA L AUTOMATICA (220V)", category: "Seladoras", model: "BSF-5640LG", next: "PAMQSLAU047", price: "Sob consulta", stockStatus: "in_stock", tags: ["Automático"],
    specifications: [{ label: "Material do Filme", value: "POF / PVC / outros" }, { label: "Largura Máx. Bobina", value: "550 mm" }, { label: "Produtividade", value: "25 peças/min" }, { label: "Comprimento Emb.", value: "400 mm" }, { label: "Largura Emb.", value: "350 mm" }, { label: "Altura Emb.", value: "130 mm" }, { label: "Tipo de Máquina", value: "Automática" }], images: [], youtubeUrl: "",
  },
  {
    id: "sll-008", name: "SELADORA L SEMI AUTOMATICA (220V)", category: "Seladoras", model: "FQL450A", next: "PAMQSLSA010", price: "Sob consulta", stockStatus: "in_stock", tags: [],
    specifications: [{ label: "Material do Filme", value: "POF / PVC / outros" }, { label: "Largura Máx. Bobina", value: "540 mm" }, { label: "Produtividade", value: "10 m/min" }, { label: "Comprimento Emb.", value: "580 mm" }, { label: "Largura Emb.", value: "420 mm" }, { label: "Altura Emb.", value: "250 mm" }, { label: "Tipo de Máquina", value: "Semiautomática" }], images: [], youtubeUrl: "",
  },
  {
    id: "sll-009", name: "SELADORA L AUTOMATICA (220V)", category: "Seladoras", model: "FQL450LB", next: "PAMQSLAU028", price: "Sob consulta", stockStatus: "in_stock", tags: ["Automático"],
    specifications: [{ label: "Material do Filme", value: "POF / PVC / outros" }, { label: "Largura Máx. Bobina", value: "520 mm" }, { label: "Produtividade", value: "30 peças/min" }, { label: "Comprimento Emb.", value: "450 mm" }, { label: "Largura Emb.", value: "320 mm" }, { label: "Altura Emb.", value: "120 mm" }, { label: "Tipo de Máquina", value: "Automática" }], images: [], youtubeUrl: "",
  },
  {
    id: "sll-010", name: "SELADORA L AUTOMATICA (220V) C/ KISS BELT", category: "Seladoras", model: "FQL450LK", next: "PAMQSLAU164", price: "Sob consulta", stockStatus: "in_stock", tags: ["Automático"],
    specifications: [{ label: "Material do Filme", value: "POF / PVC / outros" }, { label: "Largura Máx. Bobina", value: "520 mm" }, { label: "Produtividade", value: "20 peças/min" }, { label: "Comprimento Emb.", value: "100-460 mm" }, { label: "Largura Emb.", value: "40-320 mm" }, { label: "Altura Emb.", value: "20-100 mm" }, { label: "Tipo de Máquina", value: "Automática" }], images: [], youtubeUrl: "",
  },
  {
    id: "sll-011", name: "SELADORA L PNEUMATICA (220V)", category: "Seladoras", model: "FQL450T", next: "PAMQCCSA004", price: "Sob consulta", stockStatus: "in_stock", tags: [],
    specifications: [{ label: "Material do Filme", value: "POF / PVC / outros" }, { label: "Largura Máx. Bobina", value: "540 mm" }, { label: "Produtividade", value: "10 m/min" }, { label: "Comprimento Emb.", value: "560 mm" }, { label: "Largura Emb.", value: "420 mm" }, { label: "Altura Emb.", value: "250 mm" }, { label: "Tipo de Máquina", value: "Semiautomática" }], images: [], youtubeUrl: "",
  },

  // ========== SELADORAS A VÁCUO ==========
  {
    id: "sv-001", name: "SELADORA A VACUO DUPLA CAMARA 220V C/ INJ. DE GAS", category: "Seladoras", model: "DZ(Q)400/2SB", next: "PAMQSLAU050", price: "Sob consulta", stockStatus: "in_stock", tags: [],
    specifications: [{ label: "Tipo de Embalagem", value: "Embalagens Plásticos" }, { label: "Material", value: "PA+PE / EVOH / PET+PE / PE, PET, PP" }, { label: "Tipo de Máquina", value: "Semiautomática" }], images: [], youtubeUrl: "",
  },
  {
    id: "sv-002", name: "SELADORA A VACUO DUPLA CAMARA 220V C/ INJ. DE GAS", category: "Seladoras", model: "DZ(Q)500/2SB", next: "PAMQSLAU029", price: "Sob consulta", stockStatus: "in_stock", tags: [],
    specifications: [{ label: "Tipo de Embalagem", value: "Embalagens Plásticos" }, { label: "Material", value: "PA+PE / EVOH / PET+PE / PE, PET, PP" }, { label: "Tipo de Máquina", value: "Semiautomática" }], images: [], youtubeUrl: "",
  },
  {
    id: "sv-003", name: "SELADORA A VACUO DE MESA CAMARA SIMPLES", category: "Seladoras", model: "DZ260B", next: "PAMQVCMS025", price: "Sob consulta", stockStatus: "in_stock", tags: [],
    specifications: [{ label: "Tipo de Embalagem", value: "Embalagens Plásticos" }, { label: "Câmara", value: "380 × 280 × 150 mm" }, { label: "Comprimento de Selagem", value: "260 mm" }, { label: "Largura de Selagem", value: "8 mm" }, { label: "Tipo de Máquina", value: "Semiautomática" }], images: [], youtubeUrl: "",
  },
  {
    id: "sv-004", name: "SELADORA PORTATIL A VACUO COM RESERV. P/ LIQUIDO (110V)", category: "Seladoras", model: "DZ280/2SE", next: "PAMQVCMN006", price: "Sob consulta", stockStatus: "in_stock", tags: [],
    specifications: [{ label: "Tipo de Embalagem", value: "Embalagens Plásticos" }, { label: "Dimensões Emb.", value: "C ≥60 × L 30-270 mm" }, { label: "Comprimento de Selagem", value: "280 mm" }, { label: "Largura de Selagem", value: "5 mm" }, { label: "Tipo de Máquina", value: "Semiautomática" }], images: [], youtubeUrl: "",
  },
  {
    id: "sv-005", name: "SELADORA PORTATIL A VACUO COM RESERV. P/ LIQUIDO (220V)", category: "Seladoras", model: "DZ280/2SE", next: "PAMQVCMN005", price: "Sob consulta", stockStatus: "in_stock", tags: [],
    specifications: [{ label: "Tipo de Embalagem", value: "Embalagens Plásticos" }, { label: "Dimensões Emb.", value: "C ≥60 × L 30-270 mm" }, { label: "Comprimento de Selagem", value: "280 mm" }, { label: "Largura de Selagem", value: "5 mm" }, { label: "Tipo de Máquina", value: "Semiautomática" }], images: [], youtubeUrl: "",
  },
  {
    id: "sv-006", name: "SELADORA A VACUO DUPLA CAMARA (220V)", category: "Seladoras", model: "DZ400/2SB", next: "PAMQVCMS012", price: "Sob consulta", stockStatus: "in_stock", tags: [],
    specifications: [{ label: "Tipo de Embalagem", value: "Embalagens Plásticos" }, { label: "Material", value: "PA+PE / EVOH / PET+PE / PE, PET, PP" }, { label: "Tipo de Máquina", value: "Semiautomática" }], images: [], youtubeUrl: "",
  },
  {
    id: "sv-007", name: "SELADORA A VACUO DUPLA CAMARA (220V)", category: "Seladoras", model: "DZ500/2SB", next: "PAMQVCMS013", price: "Sob consulta", stockStatus: "in_stock", tags: [],
    specifications: [{ label: "Tipo de Embalagem", value: "Embalagens Plásticos" }, { label: "Material", value: "PA+PE / EVOH / PET+PE / PE, PET, PP" }, { label: "Tipo de Máquina", value: "Semiautomática" }], images: [], youtubeUrl: "",
  },
  {
    id: "sv-008", name: "SELADORA A VACUO DUPLA CAMARA (220V)", category: "Seladoras", model: "DZ600/2SB", next: "PAMQVCMS014", price: "Sob consulta", stockStatus: "in_stock", tags: [],
    specifications: [{ label: "Tipo de Embalagem", value: "Embalagens Plásticos" }, { label: "Câmara", value: "670 × 550 × 140 mm" }, { label: "Comprimento de Selagem", value: "600 mm" }, { label: "Largura de Selagem", value: "15 mm" }, { label: "Distância entre Barras", value: "400 mm" }, { label: "Tipo de Máquina", value: "Semiautomática" }], images: [], youtubeUrl: "",
  },
  {
    id: "sv-009", name: "SELADORA A VACUO DUPLA CAMARA C/ MESA PLANA", category: "Seladoras", model: "DZP600/2SB", next: "PAMQVCMS020", price: "Sob consulta", stockStatus: "in_stock", tags: [],
    specifications: [{ label: "Tipo de Embalagem", value: "Embalagens Plásticos" }, { label: "Material", value: "PA+PE / EVOH / PET+PE / PE, PET, PP" }, { label: "Tipo de Máquina", value: "Semiautomática" }], images: [], youtubeUrl: "",
  },
  {
    id: "sv-010", name: "SELADORA A VACUO DUPLA CAMARA", category: "Seladoras", model: "DZP800/2SB", next: "PAMQVCMS017", price: "Sob consulta", stockStatus: "in_stock", tags: [],
    specifications: [{ label: "Tipo de Embalagem", value: "Embalagens Plásticos" }, { label: "Largura da Câmara", value: "665 mm" }, { label: "Comprimento de Selagem", value: "800 mm" }, { label: "Distância entre Barras", value: "460 mm" }, { label: "Tipo de Máquina", value: "Semiautomática" }], images: [], youtubeUrl: "",
  },
  {
    id: "sv-011", name: "SELADORA A VACUO DE BANDEJA", category: "Seladoras", model: "SBV240TS", next: "PAMQVCSA004", price: "Sob consulta", stockStatus: "in_stock", tags: [],
    specifications: [{ label: "Tipo de Embalagem", value: "Bandeja" }, { label: "Material", value: "PP, PE, PET" }, { label: "Largura do Filme", value: "250 mm" }, { label: "Câmara", value: "287 × 208 × 56 mm" }, { label: "Produtividade", value: "100-300 bandejas/hora" }, { label: "Tipo de Máquina", value: "Semiautomática" }], images: [], youtubeUrl: "",
  },
  {
    id: "sv-012", name: "SELADORA A VACUO DE BANDEJA", category: "Seladoras", model: "SBV320TS", next: "PAMQVCSA005", price: "Sob consulta", stockStatus: "in_stock", tags: [],
    specifications: [{ label: "Tipo de Embalagem", value: "Bandeja" }, { label: "Material", value: "PP, PE, PET" }, { label: "Largura do Filme", value: "320 mm" }, { label: "Câmara", value: "418 × 297 × 56 mm" }, { label: "Produtividade", value: "100-400 bandejas/hora" }, { label: "Tipo de Máquina", value: "Semiautomática" }], images: [], youtubeUrl: "",
  },
  {
    id: "sv-013", name: "SELADORA A VACUO DE MESA (220V)", category: "Seladoras", model: "VM300TE/A", next: "PAMQVCMS001", price: "Sob consulta", stockStatus: "in_stock", tags: [],
    specifications: [{ label: "Tipo de Embalagem", value: "Embalagens plásticas" }, { label: "Câmara", value: "380 × 300 × 100 mm" }, { label: "Comprimento de Selagem", value: "280 mm" }, { label: "Largura de Selagem", value: "8 mm" }, { label: "Tipo de Máquina", value: "Semiautomática" }], images: [], youtubeUrl: "",
  },
  {
    id: "sv-014", name: "SELADORA A VACUO C/ DUPLA BARRA DE SELAGEM (220V)", category: "Seladoras", model: "VM400E/B", next: "PAMQVCMS010", price: "Sob consulta", stockStatus: "in_stock", tags: [],
    specifications: [{ label: "Tipo de Embalagem", value: "Embalagens plásticas" }, { label: "Câmara", value: "430 × 430 × 95 mm" }, { label: "Comprimento de Selagem", value: "400 mm" }, { label: "Largura de Selagem", value: "8 mm" }, { label: "Distância entre Barras", value: "325 mm" }, { label: "Tipo de Máquina", value: "Semiautomática" }], images: [], youtubeUrl: "",
  },
  {
    id: "sv-015", name: "SELADORA A VACUO DE MESA (220V)", category: "Seladoras", model: "VM400TE/B", next: "PAMQVCMS002", price: "Sob consulta", stockStatus: "in_stock", tags: [],
    specifications: [{ label: "Tipo de Embalagem", value: "Embalagens plásticas" }, { label: "Câmara", value: "430 × 430 × 95 mm" }, { label: "Comprimento de Selagem", value: "400 mm" }, { label: "Largura de Selagem", value: "8 mm" }, { label: "Distância entre Barras", value: "325 mm" }, { label: "Tipo de Máquina", value: "Semiautomática" }], images: [], youtubeUrl: "",
  },
  {
    id: "sv-016", name: "SELADORA A VACUO C/ DUPLA BARRA DE SELAGEM (220V)", category: "Seladoras", model: "VM500E/B", next: "PAMQVCMS009", price: "Sob consulta", stockStatus: "in_stock", tags: [],
    specifications: [{ label: "Tipo de Embalagem", value: "Embalagens plásticas" }, { label: "Câmara", value: "525 × 520 × 125 mm" }, { label: "Comprimento de Selagem", value: "500 mm" }, { label: "Largura de Selagem", value: "8 mm" }, { label: "Distância entre Barras", value: "400 mm" }, { label: "Tipo de Máquina", value: "Semiautomática" }], images: [], youtubeUrl: "",
  },
  {
    id: "sv-017", name: "SELADORA A VACUO DE MESA (220V)", category: "Seladoras", model: "VM500TE/B", next: "PAMQVCMS003", price: "Sob consulta", stockStatus: "in_stock", tags: [],
    specifications: [{ label: "Tipo de Embalagem", value: "Embalagens plásticas" }, { label: "Câmara", value: "525 × 520 × 125 mm" }, { label: "Comprimento de Selagem", value: "500 mm" }, { label: "Largura de Selagem", value: "8 mm" }, { label: "Distância entre Barras", value: "400 mm" }, { label: "Tipo de Máquina", value: "Semiautomática" }], images: [], youtubeUrl: "",
  },
  {
    id: "sv-018", name: "SELADORA A VACUO C/ DUPLA BARRA DE SELAGEM (220V)", category: "Seladoras", model: "VM600E/B", next: "PAMQVCMS008", price: "Sob consulta", stockStatus: "in_stock", tags: [],
    specifications: [{ label: "Tipo de Embalagem", value: "Embalagens plásticas" }, { label: "Câmara", value: "620 × 620 × 95 mm" }, { label: "Comprimento de Selagem", value: "600 mm" }, { label: "Largura de Selagem", value: "8 mm" }, { label: "Distância entre Barras", value: "530 mm" }, { label: "Tipo de Máquina", value: "Semiautomática" }], images: [], youtubeUrl: "",
  },
  {
    id: "sv-019", name: "SELADORA CONTINUA C/ SISTEMA DE VACUO - ACO PINTADO 220V/1F", category: "Seladoras", model: "FRM-980ZQ/P", next: "PAMQSLAU064", price: "Sob consulta", stockStatus: "in_stock", tags: ["Automático"],
    specifications: [{ label: "Tipo de Embalagem", value: "Embalagens plásticas" }, { label: "Material", value: "PE, PP, Folha de alumínio" }, { label: "Dimensões Emb.", value: "C 300 × L ≥60 mm" }, { label: "Produtividade", value: "0-13 m/min" }, { label: "Largura de Selagem", value: "10 mm" }, { label: "Peso Máximo", value: "10 kg" }, { label: "Tipo de Máquina", value: "Automática" }], images: [], youtubeUrl: "",
  },
  {
    id: "sv-020", name: "SELADORA CONTINUA C/ SISTEMA DE VACUO - ACO INOX 220V/1F", category: "Seladoras", model: "FRM-980ZQ/S", next: "PAMQSLAU065", price: "Sob consulta", stockStatus: "in_stock", tags: ["Automático"],
    specifications: [{ label: "Tipo de Embalagem", value: "Embalagens plásticas" }, { label: "Material", value: "PE, PP, Folha de alumínio" }, { label: "Dimensões Emb.", value: "C 300 × L ≥60 mm" }, { label: "Produtividade", value: "0-13 m/min" }, { label: "Largura de Selagem", value: "10 mm" }, { label: "Peso Máximo", value: "10 kg" }, { label: "Tipo de Máquina", value: "Automática" }], images: [], youtubeUrl: "",
  },

  // ========== SELADORAS AUTOMÁTICAS (CONTÍNUAS) ==========
  {
    id: "sa-001", name: "SELADORA CONTINUA (220V)", category: "Seladoras", model: "FR750W/P", next: "PAMQSLAU079", price: "Sob consulta", stockStatus: "in_stock", tags: ["Automático"],
    specifications: [{ label: "Material", value: "PE, PP, Folha de alumínio" }, { label: "Largura de Selagem", value: "10 mm" }, { label: "Produtividade", value: "0-13 m/min" }, { label: "Peso Máximo", value: "5 kg" }, { label: "Tipo de Máquina", value: "Automática" }], images: [], youtubeUrl: "",
  },
  {
    id: "sa-002", name: "SELADORA CONT. C/ IMP. TINTA SOLIDA (INOX)", category: "Seladoras", model: "FRD1000 LDL", next: "PAMQSLAU049", price: "Sob consulta", stockStatus: "in_stock", tags: ["Automático"],
    specifications: [{ label: "Material", value: "PE, PP, Folha de alumínio" }, { label: "Largura de Selagem", value: "10 mm" }, { label: "Comprimento Emb.", value: "100-500 mm" }, { label: "Produtividade", value: "0-13 m/min" }, { label: "Peso Máximo", value: "10 kg" }, { label: "Datador", value: "Tinta sólida" }, { label: "Tipo de Máquina", value: "Automática" }], images: [], youtubeUrl: "",
  },
  {
    id: "sa-003", name: "SELAD. CONT. C/ TINTA SOLIDA (ACO PINTADO) (220V)", category: "Seladoras", model: "FRD1000 LW-P", next: "PAMQSLAU023", price: "Sob consulta", stockStatus: "in_stock", tags: ["Automático"],
    specifications: [{ label: "Material", value: "PE, PP, Folha de alumínio" }, { label: "Largura de Selagem", value: "10 mm" }, { label: "Comprimento Emb.", value: "140-260 mm" }, { label: "Produtividade", value: "0-13 m/min" }, { label: "Peso Máximo", value: "5 kg" }, { label: "Datador", value: "Tinta sólida" }, { label: "Tipo de Máquina", value: "Automática" }], images: [], youtubeUrl: "",
  },
  {
    id: "sa-004", name: "SELADORA CONT. C/ IMP. TINTA SOLIDA (INOX) (110V)", category: "Seladoras", model: "FRD1000 LW", next: "PAMQSLAU034", price: "Sob consulta", stockStatus: "in_stock", tags: ["Automático"],
    specifications: [{ label: "Material", value: "PE, PP, Folha de alumínio" }, { label: "Largura de Selagem", value: "10 mm" }, { label: "Comprimento Emb.", value: "140-260 mm" }, { label: "Produtividade", value: "0-13 m/min" }, { label: "Peso Máximo", value: "5 kg" }, { label: "Datador", value: "Tinta sólida" }, { label: "Tipo de Máquina", value: "Automática" }], images: [], youtubeUrl: "",
  },
  {
    id: "sa-005", name: "SELADORA CONT. C/ IMP. TINTA SOLIDA (INOX) (220V)", category: "Seladoras", model: "FRD1000 LW", next: "PAMQSLAU005", price: "Sob consulta", stockStatus: "in_stock", tags: ["Automático"],
    specifications: [{ label: "Material", value: "PE, PP, Folha de alumínio" }, { label: "Largura de Selagem", value: "10 mm" }, { label: "Comprimento Emb.", value: "140-260 mm" }, { label: "Produtividade", value: "0-13 m/min" }, { label: "Peso Máximo", value: "5 kg" }, { label: "Datador", value: "Tinta sólida" }, { label: "Tipo de Máquina", value: "Automática" }], images: [], youtubeUrl: "",
  },
  {
    id: "sa-006", name: "SELAD. CONT. C/ TINTA SOLIDA INVERTIDA (INOX)", category: "Seladoras", model: "FRD1000 LW INV", next: "PAMQSLAU018", price: "Sob consulta", stockStatus: "in_stock", tags: ["Automático"],
    specifications: [{ label: "Material", value: "PE, PP, Folha de alumínio" }, { label: "Largura de Selagem", value: "10 mm" }, { label: "Comprimento Emb.", value: "140-260 mm" }, { label: "Produtividade", value: "0-13 m/min" }, { label: "Peso Máximo", value: "5 kg" }, { label: "Datador", value: "Tinta sólida" }, { label: "Tipo de Máquina", value: "Automática" }], images: [], youtubeUrl: "",
  },
  {
    id: "sa-007", name: "SELADORA CONT. C/ TINTA SOL. AREA 90MM (INOX) (220V)", category: "Seladoras", model: "FRD1000 LW5", next: "PAMQSLAU032", price: "Sob consulta", stockStatus: "in_stock", tags: ["Automático"],
    specifications: [{ label: "Material", value: "PE, PP, Folha de alumínio" }, { label: "Largura de Selagem", value: "50 mm" }, { label: "Comprimento Emb.", value: "140-260 mm" }, { label: "Produtividade", value: "0-13 m/min" }, { label: "Peso Máximo", value: "5 kg" }, { label: "Datador", value: "Tinta sólida" }, { label: "Tipo de Máquina", value: "Automática" }], images: [], youtubeUrl: "",
  },
  {
    id: "sa-008", name: "SELAD. CONT. C/ TINTA SOLIDA (ACO PINTADO) (220V)", category: "Seladoras", model: "FRD1000 W-P", next: "PAMQSLAU021", price: "Sob consulta", stockStatus: "in_stock", tags: ["Automático"],
    specifications: [{ label: "Material", value: "PE, PP, Folha de alumínio" }, { label: "Largura de Selagem", value: "10 mm" }, { label: "Comprimento Emb.", value: "80-260 mm" }, { label: "Produtividade", value: "0-13 m/min" }, { label: "Peso Máximo", value: "5 kg" }, { label: "Datador", value: "Tinta sólida" }, { label: "Tipo de Máquina", value: "Automática" }], images: [], youtubeUrl: "",
  },
  {
    id: "sa-009", name: "SELAD. CONT. C/ TINTA SOLIDA INVERTIDA (INOX) (220V)", category: "Seladoras", model: "FRD1000 W INV", next: "PAMQSLAU027", price: "Sob consulta", stockStatus: "in_stock", tags: ["Automático"],
    specifications: [{ label: "Material", value: "PE, PP, Folha de alumínio" }, { label: "Largura de Selagem", value: "10 mm" }, { label: "Comprimento Emb.", value: "80-260 mm" }, { label: "Produtividade", value: "0-13 m/min" }, { label: "Peso Máximo", value: "5 kg" }, { label: "Datador", value: "Tinta sólida" }, { label: "Tipo de Máquina", value: "Automática" }], images: [], youtubeUrl: "",
  },
  {
    id: "sa-010", name: "SELADORA CONT. C/ IMP. TINTA SOLIDA (INOX) (110V)", category: "Seladoras", model: "FRD1000 W", next: "PAMQSLAU035", price: "Sob consulta", stockStatus: "in_stock", tags: ["Automático"],
    specifications: [{ label: "Material", value: "PE, PP, Folha de alumínio" }, { label: "Largura de Selagem", value: "10 mm" }, { label: "Comprimento Emb.", value: "80-260 mm" }, { label: "Produtividade", value: "0-13 m/min" }, { label: "Peso Máximo", value: "5 kg" }, { label: "Datador", value: "Tinta sólida" }, { label: "Tipo de Máquina", value: "Automática" }], images: [], youtubeUrl: "",
  },
  {
    id: "sa-011", name: "SELADORA CONT. C/ IMP. TINTA SOLIDA (INOX) (220V)", category: "Seladoras", model: "FRD1000 W", next: "PAMQSLAU004", price: "Sob consulta", stockStatus: "in_stock", tags: ["Automático"],
    specifications: [{ label: "Material", value: "PE, PP, Folha de alumínio" }, { label: "Largura de Selagem", value: "10 mm" }, { label: "Comprimento Emb.", value: "80-260 mm" }, { label: "Produtividade", value: "0-13 m/min" }, { label: "Peso Máximo", value: "5 kg" }, { label: "Datador", value: "Tinta sólida" }, { label: "Tipo de Máquina", value: "Automática" }], images: [], youtubeUrl: "",
  },
  {
    id: "sa-012", name: "SELADORA CONTINUA VERT. EM ACO INOX C/ IMP T. SOLIDA 220V", category: "Seladoras", model: "FRM-1120LD", next: "PAMQSLAU044", price: "Sob consulta", stockStatus: "in_stock", tags: ["Automático"],
    specifications: [{ label: "Material", value: "PE, PP, Folha de alumínio" }, { label: "Largura de Selagem", value: "10 mm" }, { label: "Comprimento Emb.", value: "100-700 mm" }, { label: "Produtividade", value: "0-10 m/min" }, { label: "Peso Máximo", value: "15 kg" }, { label: "Datador", value: "Tinta sólida" }, { label: "Tipo de Máquina", value: "Automática" }], images: [], youtubeUrl: "",
  },
  {
    id: "sa-013", name: "SELADORA CONTINUA VERT. EM ACO PINT. C/ IMP T. SOLIDA 220V/1F", category: "Seladoras", model: "FRM-1120LD", next: "PAMQSLAU066", price: "Sob consulta", stockStatus: "in_stock", tags: ["Automático"],
    specifications: [{ label: "Material", value: "PE, PP, Folha de alumínio" }, { label: "Largura de Selagem", value: "10 mm" }, { label: "Comprimento Emb.", value: "100-700 mm" }, { label: "Produtividade", value: "0-10 m/min" }, { label: "Peso Máximo", value: "15 kg" }, { label: "Datador", value: "Tinta sólida" }, { label: "Tipo de Máquina", value: "Automática" }], images: [], youtubeUrl: "",
  },
  {
    id: "sa-014", name: "SELADORA CONTINUA C/ ESTEIRA 400MM DE LARGURA", category: "Seladoras", model: "FRP770W/400", next: "PAMQSLAU062", price: "Sob consulta", stockStatus: "in_stock", tags: ["Automático"],
    specifications: [{ label: "Material", value: "PE, PP, Folha de alumínio" }, { label: "Largura de Selagem", value: "12 mm" }, { label: "Comprimento Emb.", value: "100-450 mm" }, { label: "Produtividade", value: "0-10 m/min" }, { label: "Peso Máximo", value: "15 kg" }, { label: "Tipo de Máquina", value: "Automática" }], images: [], youtubeUrl: "",
  },
  {
    id: "sa-015", name: "SELADORA CONTINUA PARA GRAU CIRURGICO", category: "Seladoras", model: "HRS255", next: "PAMQSLAU053", price: "Sob consulta", stockStatus: "in_stock", tags: [],
    specifications: [{ label: "Material", value: "PE, PP, Folha de alumínio" }, { label: "Largura de Selagem", value: "12 mm" }, { label: "Produtividade", value: "0-10 m/min" }, { label: "Tipo de Máquina", value: "Semiautomática" }], images: [], youtubeUrl: "",
  },
  {
    id: "sa-016", name: "SELADORA CONTINUA SEMI AUTOMATICA", category: "Seladoras", model: "HRS640", next: "PAMQSLAU087", price: "Sob consulta", stockStatus: "in_stock", tags: [],
    specifications: [{ label: "Material", value: "PE, PP, Folha de alumínio" }, { label: "Largura de Selagem", value: "10 mm" }, { label: "Produtividade", value: "8 m/min (velocidade fixa)" }, { label: "Tipo de Máquina", value: "Semiautomática" }], images: [], youtubeUrl: "",
  },
  {
    id: "sa-017", name: "SELADORA CONTINUA SEMI AUTOMATICA AZUL (220V)", category: "Seladoras", model: "PRATIC SEAL TC20", next: "PAMQSLAU088", price: "Sob consulta", stockStatus: "in_stock", tags: [],
    specifications: [{ label: "Material", value: "PE, PP, e outros plásticos" }, { label: "Largura de Selagem", value: "10 mm" }, { label: "Produtividade", value: "0-5 m/min" }, { label: "Tipo de Máquina", value: "Semiautomática" }], images: [], youtubeUrl: "",
  },
  {
    id: "sa-018", name: "SELADORA CONTINUA SEMI AUTOMATICA ROSA (220V)", category: "Seladoras", model: "PRATIC SEAL TC20", next: "PAMQSLAU089", price: "Sob consulta", stockStatus: "in_stock", tags: [],
    specifications: [{ label: "Material", value: "PE, PP, e outros plásticos" }, { label: "Largura de Selagem", value: "10 mm" }, { label: "Produtividade", value: "0-5 m/min" }, { label: "Tipo de Máquina", value: "Semiautomática" }], images: [], youtubeUrl: "",
  },
  {
    id: "sa-019", name: "SELADORA CONTINUA COM IMPRESSAO DE INK JET", category: "Seladoras", model: "SCI770", next: "PAMQSLAU077", price: "Sob consulta", stockStatus: "in_stock", tags: ["Automático"],
    specifications: [{ label: "Material", value: "PE, PP, Folha de alumínio" }, { label: "Largura de Selagem", value: "10 mm" }, { label: "Comprimento Emb.", value: "140-260 mm" }, { label: "Produtividade", value: "0-13 m/min" }, { label: "Peso Máximo", value: "5 kg" }, { label: "Datador", value: "Inkjet" }, { label: "Tipo de Máquina", value: "Automática" }], images: [], youtubeUrl: "",
  },
  {
    id: "sa-020", name: "SELADORA CONTINUA (ACO PINTADO) (220V)", category: "Seladoras", model: "SF150 LW-P", next: "PAMQSLAU024", price: "Sob consulta", stockStatus: "in_stock", tags: ["Automático"],
    specifications: [{ label: "Material", value: "PE, PP, Folha de alumínio" }, { label: "Largura de Selagem", value: "10 mm" }, { label: "Comprimento Emb.", value: "140-260 mm" }, { label: "Produtividade", value: "0-13 m/min" }, { label: "Peso Máximo", value: "5 kg" }, { label: "Tipo de Máquina", value: "Automática" }], images: [], youtubeUrl: "",
  },
  {
    id: "sa-021", name: "SELADORA CONTINUA (INOX) (110V)", category: "Seladoras", model: "SF150 LW", next: "PAMQSLAU037", price: "Sob consulta", stockStatus: "in_stock", tags: ["Automático"],
    specifications: [{ label: "Material", value: "PE, PP, Folha de alumínio" }, { label: "Largura de Selagem", value: "10 mm" }, { label: "Comprimento Emb.", value: "140-260 mm" }, { label: "Produtividade", value: "0-13 m/min" }, { label: "Peso Máximo", value: "5 kg" }, { label: "Tipo de Máquina", value: "Automática" }], images: [], youtubeUrl: "",
  },
  {
    id: "sa-022", name: "SELADORA CONTINUA (INOX) (220V)", category: "Seladoras", model: "SF150 LW", next: "PAMQSLAU002", price: "Sob consulta", stockStatus: "in_stock", tags: ["Automático"],
    specifications: [{ label: "Material", value: "PE, PP, Folha de alumínio" }, { label: "Largura de Selagem", value: "10 mm" }, { label: "Comprimento Emb.", value: "140-260 mm" }, { label: "Produtividade", value: "0-13 m/min" }, { label: "Peso Máximo", value: "5 kg" }, { label: "Tipo de Máquina", value: "Automática" }], images: [], youtubeUrl: "",
  },
  {
    id: "sa-023", name: "SELADORA CONTINUA INVERTIDA (INOX) (220V)", category: "Seladoras", model: "SF150 LW INV", next: "PAMQSLAU019", price: "Sob consulta", stockStatus: "in_stock", tags: ["Automático"],
    specifications: [{ label: "Material", value: "PE, PP, Folha de alumínio" }, { label: "Largura de Selagem", value: "10 mm" }, { label: "Comprimento Emb.", value: "140-260 mm" }, { label: "Produtividade", value: "0-13 m/min" }, { label: "Peso Máximo", value: "5 kg" }, { label: "Tipo de Máquina", value: "Automática" }], images: [], youtubeUrl: "",
  },
  {
    id: "sa-024", name: "SELADORA CONTINUA (ACO PINTADO) (220V)", category: "Seladoras", model: "SF150 W-P", next: "PAMQSLAU022", price: "Sob consulta", stockStatus: "in_stock", tags: ["Automático"],
    specifications: [{ label: "Material", value: "PE, PP, Folha de alumínio" }, { label: "Largura de Selagem", value: "10 mm" }, { label: "Comprimento Emb.", value: "80-260 mm" }, { label: "Produtividade", value: "0-13 m/min" }, { label: "Peso Máximo", value: "5 kg" }, { label: "Tipo de Máquina", value: "Automática" }], images: [], youtubeUrl: "",
  },
  {
    id: "sa-025", name: "SELADORA CONTINUA (INOX) (110V)", category: "Seladoras", model: "SF150 W", next: "PAMQSLAU039", price: "Sob consulta", stockStatus: "in_stock", tags: ["Automático"],
    specifications: [{ label: "Material", value: "PE, PP, Folha de alumínio" }, { label: "Largura de Selagem", value: "10 mm" }, { label: "Comprimento Emb.", value: "80-260 mm" }, { label: "Produtividade", value: "0-13 m/min" }, { label: "Peso Máximo", value: "5 kg" }, { label: "Tipo de Máquina", value: "Automática" }], images: [], youtubeUrl: "",
  },
  {
    id: "sa-026", name: "SELADORA CONTINUA (INOX) (220V)", category: "Seladoras", model: "SF150 W", next: "PAMQSLAU001", price: "Sob consulta", stockStatus: "in_stock", tags: ["Automático"],
    specifications: [{ label: "Material", value: "PE, PP, Folha de alumínio" }, { label: "Largura de Selagem", value: "10 mm" }, { label: "Comprimento Emb.", value: "80-260 mm" }, { label: "Produtividade", value: "0-13 m/min" }, { label: "Peso Máximo", value: "5 kg" }, { label: "Tipo de Máquina", value: "Automática" }], images: [], youtubeUrl: "",
  },
  {
    id: "sa-027", name: "SELADORA CONTINUA INVERTIDA (INOX) (220V)", category: "Seladoras", model: "SF150 W INV", next: "PAMQSLAU020", price: "Sob consulta", stockStatus: "in_stock", tags: ["Automático"],
    specifications: [{ label: "Material", value: "PE, PP, Folha de alumínio" }, { label: "Largura de Selagem", value: "10 mm" }, { label: "Comprimento Emb.", value: "80-260 mm" }, { label: "Produtividade", value: "0-13 m/min" }, { label: "Peso Máximo", value: "5 kg" }, { label: "Tipo de Máquina", value: "Automática" }], images: [], youtubeUrl: "",
  },

  // ========== ABASTECEDOR AUTOMÁTICO ==========
  {
    id: "ab-001", name: "QE-A - UNIDADE RESFRIADORA/REFRIGERADORA PARA AGUA GELADA", category: "Abastecedor Automático", model: "QE-A", next: "PAMQLQAU035", price: "Sob consulta", stockStatus: "in_stock", tags: ["Automático"],
    specifications: [{ label: "Potência", value: "2.270 W" }, { label: "Potência de Resfriamento", value: "7.200 W" }, { label: "Potência Bombeamento Interno", value: "370 W" }, { label: "BTU/hora", value: "18.000" }, { label: "Volume Evaporador", value: "27 L" }, { label: "Fluxo de Ar Resfriado", value: "2.000 m³/h" }, { label: "Fluxo de Fluído Refrigerado", value: "0,91 m³/h" }, { label: "Tipo de Máquina", value: "Automática" }], images: [], youtubeUrl: "",
  },

  // ========== ALIMENTADORES PARAFUSO ==========
  {
    id: "alp-001", name: "ALIMENTADOR DE ROSCA PARA POS ALT. 2,5METROS - FUNIL 110 LITROS", category: "Alimentadores de Parafuso", model: "ALIM-ROSCA-2500", next: "PAMQGPAU080", price: "Sob consulta", stockStatus: "in_stock", tags: ["Automático"],
    specifications: [{ label: "Tipo de Produto", value: "Pós" }, { label: "Altura (até a boca)", value: "2.000 mm" }, { label: "Volume do Funil", value: "110 L" }, { label: "Diâmetro da Boca", value: "110 mm" }, { label: "Tipo de Máquina", value: "Automática" }], images: [], youtubeUrl: "",
  },
  {
    id: "alp-002", name: "ALIMENTADOR DE ROSCA PARA POS - FUNIL 110 LITROS", category: "Alimentadores de Parafuso", model: "ALIM-ROSCA-1600", next: "PAMQGPAU038", price: "Sob consulta", stockStatus: "in_stock", tags: ["Automático"],
    specifications: [{ label: "Tipo de Produto", value: "Pós" }, { label: "Altura (até a boca)", value: "1.600 mm" }, { label: "Volume do Funil", value: "110 L" }, { label: "Diâmetro da Boca", value: "110 mm" }, { label: "Tipo de Máquina", value: "Automática" }], images: [], youtubeUrl: "",
  },

  // ========== APLICADOR MANUAL DE STRETCH ==========
  {
    id: "ams-001", name: "E610 - APLICADOR MANUAL DE FILME STRETCH", category: "Aplicador de Stretch", model: "E610", next: "PAMQSLMN024", price: "Sob consulta", stockStatus: "in_stock", tags: ["Manual"],
    specifications: [{ label: "Tipo de Produto", value: "Filme Stretch" }, { label: "Ø Interno Mín. Bobina", value: "Ø38 mm" }, { label: "Ø Externo Máx. Bobina", value: "Ø76 mm" }, { label: "Comprimento da Bobina", value: "300-500 mm" }, { label: "Produtividade", value: "A depender da velocidade de operação" }, { label: "Tipo de Máquina", value: "Manual" }], images: [], youtubeUrl: "",
  },

  // ========== APLICADOR AUTOMÁTICO DE STRETCH ==========
  {
    id: "aas-001", name: "BL2000A - STRECHADEIRA AUTOMATICA DE PALETES", category: "Aplicador de Stretch", model: "BL2000A", next: "PAMQSLAU058", price: "Sob consulta", stockStatus: "in_stock", tags: ["Automático"],
    specifications: [{ label: "Tipo de Produto", value: "Filme Stretch" }, { label: "Comprimento Bobina", value: "500 mm" }, { label: "Ø Plataforma Giratória", value: "Ø1500 mm (personalizável p/ 1650, 1800 ou 2000)" }, { label: "Altura do Palete", value: "2.100 mm" }, { label: "Peso Máx. Palete", value: "2.000 kg" }, { label: "Produtividade", value: "15-140 paletes/hora" }, { label: "Tipo de Máquina", value: "Automática" }], images: [], youtubeUrl: "",
  },
  {
    id: "aas-002", name: "BL2000B - STRECHADEIRA AUTOMATICA DE PALETES", category: "Aplicador de Stretch", model: "BL2000B", next: "PAMQSLAU033", price: "Sob consulta", stockStatus: "in_stock", tags: ["Automático"],
    specifications: [{ label: "Tipo de Produto", value: "Filme Stretch" }, { label: "Comprimento Bobina", value: "500 mm" }, { label: "Ø Plataforma Giratória", value: "Ø1500 mm (personalizável p/ 1650, 1800 ou 2000)" }, { label: "Altura do Palete", value: "2.100 mm" }, { label: "Peso Máx. Palete", value: "2.000 kg" }, { label: "Produtividade", value: "15-140 paletes/hora" }, { label: "Tipo de Máquina", value: "Automática" }], images: [], youtubeUrl: "",
  },
  {
    id: "aas-003", name: "BL2000P - STRECHADEIRA AUTOMATICA DE PALETES", category: "Aplicador de Stretch", model: "BL2000P", next: "PAMQSLAU056", price: "Sob consulta", stockStatus: "in_stock", tags: ["Automático"],
    specifications: [{ label: "Tipo de Produto", value: "Filme Stretch" }, { label: "Comprimento Bobina", value: "500 mm" }, { label: "Ø Plataforma Giratória", value: "Ø1500 mm (personalizável p/ 1650, 1800 ou 2000)" }, { label: "Altura do Palete", value: "1.800 mm" }, { label: "Peso Máx. Palete", value: "2.000 kg" }, { label: "Produtividade", value: "15-140 paletes/hora" }, { label: "Tipo de Máquina", value: "Automática" }], images: [], youtubeUrl: "",
  },

  // ========== ARQUEADORA ==========
  {
    id: "arq-001", name: "XQD-25E - ARQUEADORA PNEUMATICA MANUAL", category: "Arqueadoras", model: "XQD-25E", next: "PAMQARSA009", price: "Sob consulta", stockStatus: "in_stock", tags: ["Manual"],
    specifications: [{ label: "Tipo de Produto", value: "Fita de Arquear" }, { label: "Tipo de Fita", value: "Poliéster (PET) / PP" }, { label: "Espessura da Fita", value: "0,5-1,5 mm" }, { label: "Largura da Fita", value: "19-25 mm" }, { label: "Produtividade", value: "Depende do tamanho do produto" }, { label: "Tipo de Máquina", value: "Manual" }], images: [], youtubeUrl: "",
  },
  {
    id: "arq-002", name: "XQD-19E - ARQUEADORA PNEUMATICA MANUAL", category: "Arqueadoras", model: "XQD-19E", next: "PAMQARSA008", price: "Sob consulta", stockStatus: "in_stock", tags: ["Manual"],
    specifications: [{ label: "Tipo de Produto", value: "Fita de Arquear" }, { label: "Tipo de Fita", value: "Poliéster (PET) / PP" }, { label: "Espessura da Fita", value: "0,5-1,5 mm" }, { label: "Largura da Fita", value: "13-19 mm" }, { label: "Produtividade", value: "Depende do tamanho do produto" }, { label: "Tipo de Máquina", value: "Manual" }], images: [], youtubeUrl: "",
  },
  {
    id: "arq-003", name: "MH301A - MAQUINA ARQUEADORA AUTOMATICA", category: "Arqueadoras", model: "MH301A", next: "PAMQARAU009", price: "Sob consulta", stockStatus: "in_stock", tags: ["Automático"],
    specifications: [{ label: "Tipo de Produto", value: "Fita de Arquear" }, { label: "Tipo de Fita", value: "PP (Polipropileno)" }, { label: "Espessura da Fita", value: "0,55-1 mm" }, { label: "Largura da Fita", value: "9-15 mm" }, { label: "Largura da Caixa", value: "80-800 mm" }, { label: "Altura da Caixa", value: "60-600 mm" }, { label: "Área Útil", value: "625 × 800 mm" }, { label: "Produtividade", value: "até 2 seg/arqueação" }, { label: "Tipo de Máquina", value: "Automática" }], images: [], youtubeUrl: "",
  },
  {
    id: "arq-004", name: "SM10H - MAQ. SEMI-AUTOM. DE ARQUEAR 220V", category: "Arqueadoras", model: "SM10H", next: "PAMQARSA006", price: "Sob consulta", stockStatus: "in_stock", tags: [],
    specifications: [{ label: "Tipo de Produto", value: "Fita de Arquear" }, { label: "Tipo de Fita", value: "PP (Polipropileno)" }, { label: "Espessura da Fita", value: "0,55-1 mm" }, { label: "Largura da Fita", value: "5-15 mm" }, { label: "Largura da Caixa", value: "150-650 mm" }, { label: "Altura da Caixa", value: "60-800 mm" }, { label: "Área Útil", value: "650 × 520 mm" }, { label: "Produtividade", value: "até 0,53 seg/arqueação" }, { label: "Tipo de Máquina", value: "Semiautomática" }], images: [], youtubeUrl: "",
  },

  // ========== DATADORAS ==========
  {
    id: "dt-001", name: "MY380/M DATADOR C/ BASE AUMENTADA C/ TINTA SOLIDA E CONTADOR (INOX)", category: "Datadoras", model: "MY380/M", next: "PAMQIPAU008", price: "Sob consulta", stockStatus: "in_stock", tags: ["Automático"],
    specifications: [{ label: "Tipo de Produto", value: "Rótulos/Papéis/Embalagens" }, { label: "Comprimento do Produto", value: "50-200 mm" }, { label: "Largura do Produto", value: "65-230 mm" }, { label: "Impressão", value: "5 linhas | 15 caracteres/linha" }, { label: "Produtividade", value: "300 impressões/min" }, { label: "Tipo de Impressão", value: "Tinta sólida" }, { label: "Tipo de Máquina", value: "Automática" }], images: [], youtubeUrl: "",
  },
  {
    id: "dt-002", name: "M6 - IMPRESSORA MANUAL JATO DE TINTA COM P/ TOUCH", category: "Datadoras", model: "M6", next: "PAMQIPMN069", price: "Sob consulta", stockStatus: "in_stock", tags: ["Manual"],
    specifications: [{ label: "Tipo de Produto", value: "Aço/Ferro/Madeira/Vidro/Concreto/Plástico/Papel" }, { label: "Distância de Impressão", value: "2-5 mm" }, { label: "Altura de Impressão", value: "2-12,7 mm" }, { label: "Produtividade", value: "70 m/min" }, { label: "Tipo de Impressão", value: "Inkjet" }, { label: "Resolução", value: "300 ppp" }, { label: "Tipo de Máquina", value: "Manual" }], images: [], youtubeUrl: "",
  },
  {
    id: "dt-003", name: "HP351 - DATADORA HOT STAMP MANUAL (220V) P/ POTES C/ SUPORTE DE PEDAL", category: "Datadoras", model: "HP351", next: "PAMQIPMN065", price: "Sob consulta", stockStatus: "in_stock", tags: ["Manual"],
    specifications: [{ label: "Tipo de Produto", value: "Rótulos/Papéis/Embalagens/sacos/pequenas caixas" }, { label: "Impressão", value: "3 linhas | 15 caracteres/linha" }, { label: "Tipo de Impressão", value: "Fita Ribbon" }, { label: "Tipo de Máquina", value: "Manual" }], images: [], youtubeUrl: "",
  },
  {
    id: "dt-004", name: "HP351 - DATADORA HOT STAMP MANUAL (110V) P/ POTES C/ SUPORTE DE PEDAL", category: "Datadoras", model: "HP351", next: "PAMQIPMN064", price: "Sob consulta", stockStatus: "in_stock", tags: ["Manual"],
    specifications: [{ label: "Tipo de Produto", value: "Rótulos/Papéis/Embalagens/sacos/pequenas caixas" }, { label: "Impressão", value: "3 linhas | 15 caracteres/linha" }, { label: "Tipo de Impressão", value: "Fita Ribbon" }, { label: "Tipo de Máquina", value: "Manual" }], images: [], youtubeUrl: "",
  },
  {
    id: "dt-005", name: "HP351 - DATADORA HOT STAMP MANUAL (220V) - C/ SUP. MESA P/ POTES", category: "Datadoras", model: "HP351", next: "PAMQIPMN063", price: "Sob consulta", stockStatus: "in_stock", tags: ["Manual"],
    specifications: [{ label: "Tipo de Produto", value: "Rótulos/Papéis/Embalagens/sacos/pequenas caixas" }, { label: "Impressão", value: "3 linhas | 15 caracteres/linha" }, { label: "Tipo de Impressão", value: "Fita Ribbon" }, { label: "Tipo de Máquina", value: "Manual" }], images: [], youtubeUrl: "",
  },
  {
    id: "dt-006", name: "MX2 - IMPRESSORA JATO DE TINTA C/ PAINEL TOUCH", category: "Datadoras", model: "MX2", next: "PAMQIPMN040", price: "Sob consulta", stockStatus: "in_stock", tags: ["Automático"],
    specifications: [{ label: "Tipo de Produto", value: "Aço/Ferro/Madeira/Vidro/Concreto/Plástico/Papel" }, { label: "Distância de Impressão", value: "2-5 mm" }, { label: "Altura de Impressão", value: "1-25,4 mm" }, { label: "Impressão", value: "1-6 linhas" }, { label: "Produtividade", value: "70 m/min" }, { label: "Tipo de Impressão", value: "Inkjet" }, { label: "Resolução", value: "600 ppp" }, { label: "Tipo de Máquina", value: "Automática" }], images: [], youtubeUrl: "",
  },
  {
    id: "dt-007", name: "MX1 - IMPRESSORA JATO DE TINTA C/ PAINEL TOUCH", category: "Datadoras", model: "MX1", next: "PAMQIPMN039", price: "Sob consulta", stockStatus: "in_stock", tags: ["Automático"],
    specifications: [{ label: "Tipo de Produto", value: "Aço/Ferro/Madeira/Vidro/Concreto/Plástico/Papel" }, { label: "Distância de Impressão", value: "2-5 mm" }, { label: "Altura de Impressão", value: "1-12,7 mm" }, { label: "Impressão", value: "1-6 linhas" }, { label: "Produtividade", value: "70 m/min" }, { label: "Tipo de Impressão", value: "Inkjet" }, { label: "Resolução", value: "600 ppp" }, { label: "Tipo de Máquina", value: "Automática" }], images: [], youtubeUrl: "",
  },
  {
    id: "dt-008", name: "M7 - IMPRESSORA MANUAL JATO DE TINTA COM P/ TOUCH", category: "Datadoras", model: "M7", next: "PAMQIPMN038", price: "Sob consulta", stockStatus: "in_stock", tags: ["Manual"],
    specifications: [{ label: "Tipo de Produto", value: "Aço/Ferro/Madeira/Vidro/Concreto/Plástico/Papel" }, { label: "Distância de Impressão", value: "2-5 mm" }, { label: "Altura de Impressão", value: "2-12,7 mm" }, { label: "Produtividade", value: "70 m/min" }, { label: "Tipo de Impressão", value: "Inkjet" }, { label: "Resolução", value: "600 ppp" }, { label: "Tipo de Máquina", value: "Manual" }], images: [], youtubeUrl: "",
  },
  {
    id: "dt-009", name: "MY380 DATADOR COM TINTA SOLIDA E CONTADOR (ACO PINTADO)", category: "Datadoras", model: "MY380", next: "PAMQIPAU004", price: "Sob consulta", stockStatus: "in_stock", tags: ["Automático"],
    specifications: [{ label: "Tipo de Produto", value: "Rótulos/Papéis/Embalagens" }, { label: "Comprimento do Produto", value: "50-200 mm" }, { label: "Largura do Produto", value: "65-175 mm" }, { label: "Impressão", value: "5 linhas | 15 caracteres/linha" }, { label: "Produtividade", value: "300 impressões/min" }, { label: "Tipo de Impressão", value: "Tinta sólida" }, { label: "Tipo de Máquina", value: "Automática" }], images: [], youtubeUrl: "",
  },
  {
    id: "dt-010", name: "HP351 - DATADORA HOT STAMP MANUAL (110V)", category: "Datadoras", model: "HP351", next: "PAMQIPMN015", price: "Sob consulta", stockStatus: "in_stock", tags: ["Manual"],
    specifications: [{ label: "Tipo de Produto", value: "Rótulos/Papéis/Embalagens/sacos/pequenas caixas" }, { label: "Impressão", value: "3 linhas | 15 caracteres/linha" }, { label: "Tipo de Impressão", value: "Fita Ribbon" }, { label: "Tipo de Máquina", value: "Manual" }], images: [], youtubeUrl: "",
  },
  {
    id: "dt-011", name: "HP351 - DATADORA HOT STAMP MANUAL (220V)", category: "Datadoras", model: "HP351", next: "PAMQIPMN002", price: "Sob consulta", stockStatus: "in_stock", tags: ["Manual"],
    specifications: [{ label: "Tipo de Produto", value: "Rótulos/Papéis/Embalagens/sacos/pequenas caixas" }, { label: "Impressão", value: "3 linhas | 15 caracteres/linha" }, { label: "Tipo de Impressão", value: "Fita Ribbon" }, { label: "Tipo de Máquina", value: "Manual" }], images: [], youtubeUrl: "",
  },
  {
    id: "dt-012", name: "HP241C - DATADORA HOT STAMP ELETRICA (3 LINHAS)(220V)", category: "Datadoras", model: "HP241C", next: "PAMQIPEL002", price: "Sob consulta", stockStatus: "in_stock", tags: ["Manual"],
    specifications: [{ label: "Tipo de Produto", value: "Rótulos/Papéis/Embalagens/sacos/pequenas caixas" }, { label: "Impressão", value: "3 linhas | 15 caracteres/linha" }, { label: "Tipo de Impressão", value: "Fita Ribbon" }, { label: "Tipo de Máquina", value: "Manual" }], images: [], youtubeUrl: "",
  },
  {
    id: "dt-013", name: "MY380 DATADOR COM TINTA SOLIDA E CONTADOR (INOX)", category: "Datadoras", model: "MY380", next: "PAMQIPAU002", price: "Sob consulta", stockStatus: "in_stock", tags: ["Automático"],
    specifications: [{ label: "Tipo de Produto", value: "Rótulos/Papéis/Embalagens" }, { label: "Comprimento do Produto", value: "50-200 mm" }, { label: "Largura do Produto", value: "65-175 mm" }, { label: "Impressão", value: "5 linhas | 15 caracteres/linha" }, { label: "Produtividade", value: "300 impressões/min" }, { label: "Tipo de Impressão", value: "Tinta sólida" }, { label: "Tipo de Máquina", value: "Automática" }], images: [], youtubeUrl: "",
  },

  // ========== DISPENSADOR DE FITA AUTOMÁTICO ==========
  {
    id: "df-001", name: "FX-800C - DISPENSADOR AUTOMATICO DE FITA GOMADA", category: "Dispensadores de Fita", model: "FX-800C", next: "PAMQSLMN094", price: "Sob consulta", stockStatus: "in_stock", tags: ["Automático"],
    specifications: [{ label: "Tipo de Produto", value: "Fita Gomada" }, { label: "Largura da Fita", value: "20-100 mm" }, { label: "Comprimento Máx. Fita", value: "210 mm" }, { label: "Ø Máx. Bobina", value: "Ø210 mm" }, { label: "Produtividade", value: "60 m/min" }, { label: "Tipo de Máquina", value: "Automática" }], images: [], youtubeUrl: "",
  },
  {
    id: "df-002", name: "FX-800P - DISPENSADOR AUTOMATICO DE FITA GOMADA", category: "Dispensadores de Fita", model: "FX-800P", next: "PAMQSLMN058", price: "Sob consulta", stockStatus: "in_stock", tags: ["Automático"],
    specifications: [{ label: "Tipo de Produto", value: "Fita Gomada" }, { label: "Largura da Fita", value: "20-100 mm" }, { label: "Comprimento Máx. Fita", value: "100 mm ou mais" }, { label: "Ø Máx. Bobina", value: "Ø200 mm" }, { label: "Produtividade", value: "60 m/min" }, { label: "Tipo de Máquina", value: "Automática" }], images: [], youtubeUrl: "",
  },
  {
    id: "df-003", name: "FX-800 - APLICADOR/DISPENSADOR SEMI AUTOMATICO P/ FITA GOMADA", category: "Dispensadores de Fita", model: "FX-800", next: "PAMQSLMN029", price: "Sob consulta", stockStatus: "in_stock", tags: [],
    specifications: [{ label: "Tipo de Produto", value: "Fita Gomada" }, { label: "Largura da Fita", value: "20-100 mm" }, { label: "Comprimento Máx. Fita", value: "100-1000 mm" }, { label: "Ø Máx. Bobina", value: "Ø200 mm" }, { label: "Produtividade", value: "Depende da velocidade de operação" }, { label: "Tipo de Máquina", value: "Semiautomática" }], images: [], youtubeUrl: "",
  },

  // ========== DOSADORAS ==========
  {
    id: "dm-001", name: "DM1000F - DOSADORA C/ BALANCA ELETR. P/ POS BX FLUIDEZ 100~1000g", category: "Dosadoras", model: "DM1000F", next: "PAMQSLSA124", price: "Sob consulta", stockStatus: "in_stock", tags: [],
    specifications: [{ label: "Tipo de Produto", value: "Pós (Baixa Fluidez)" }, { label: "Dosagem", value: "100-1000 g" }, { label: "Produtividade", value: "10-20 embalagens/min" }, { label: "Tipo de Máquina", value: "Semiautomática" }], images: [], youtubeUrl: "",
  },
  {
    id: "dm-002", name: "DM1000S - DOSADORA C/ BALANCA ELETR. P/ GRANULADOS 100~1000g", category: "Dosadoras", model: "DM1000S", next: "PAMQSLSA122", price: "Sob consulta", stockStatus: "in_stock", tags: [],
    specifications: [{ label: "Tipo de Produto", value: "Granulados (Alta Fluidez)" }, { label: "Dosagem", value: "100-1000 g" }, { label: "Produtividade", value: "10-20 embalagens/min" }, { label: "Tipo de Máquina", value: "Semiautomática" }], images: [], youtubeUrl: "",
  },
  {
    id: "dm-003", name: "DM5000F - DOSADORA C/ BALANCA ELETR. P/ POS BX FLUIDEZ 200~5000g", category: "Dosadoras", model: "DM5000F", next: "PAMQSLSA125", price: "Sob consulta", stockStatus: "in_stock", tags: [],
    specifications: [{ label: "Tipo de Produto", value: "Pós (Baixa Fluidez)" }, { label: "Dosagem", value: "200-5000 g" }, { label: "Produtividade", value: "10-20 embalagens/min" }, { label: "Tipo de Máquina", value: "Semiautomática" }], images: [], youtubeUrl: "",
  },
  {
    id: "dm-004", name: "DM5000S - DOSADORA C/ BALANCA ELETR. P/ GRANULADOS 200~5000g", category: "Dosadoras", model: "DM5000S", next: "PAMQSLSA123", price: "Sob consulta", stockStatus: "in_stock", tags: [],
    specifications: [{ label: "Tipo de Produto", value: "Granulados (Alta Fluidez)" }, { label: "Dosagem", value: "200-5000 g" }, { label: "Produtividade", value: "10-20 embalagens/min" }, { label: "Tipo de Máquina", value: "Semiautomática" }], images: [], youtubeUrl: "",
  },
  {
    id: "dm-005", name: "KFG1000 - MAQUINA SEMI-AUT. P/ ENCHIM. GRAOS E FARELOS (220V)", category: "Dosadoras", model: "KFG1000", next: "PAMQEVSA001", price: "Sob consulta", stockStatus: "in_stock", tags: [],
    specifications: [{ label: "Tipo de Produto", value: "Grãos e Farelos" }, { label: "Dosagem", value: "500-1000 ml" }, { label: "Produtividade", value: "5-30 embalagens/min" }, { label: "Tipo de Máquina", value: "Semiautomática" }], images: [], youtubeUrl: "",
  },
  {
    id: "dm-006", name: "KFG250 - MAQUINA SEMI-AUT. P/ ENCHIM. GRAOS E FARELOS (220V)", category: "Dosadoras", model: "KFG250", next: "PAMQCCSA003", price: "Sob consulta", stockStatus: "in_stock", tags: [],
    specifications: [{ label: "Tipo de Produto", value: "Grãos e Farelos" }, { label: "Dosagem", value: "50-250 ml" }, { label: "Produtividade", value: "5-30 embalagens/min" }, { label: "Tipo de Máquina", value: "Semiautomática" }], images: [], youtubeUrl: "",
  },
  {
    id: "dm-007", name: "KFG500 - MAQUINA SEMI-AUT. P/ ENCHIM. GRAOS E FARELOS (220V)", category: "Dosadoras", model: "KFG500", next: "PAMQGPSA001", price: "Sob consulta", stockStatus: "in_stock", tags: [],
    specifications: [{ label: "Tipo de Produto", value: "Grãos e Farelos" }, { label: "Dosagem", value: "250-500 ml" }, { label: "Produtividade", value: "5-30 embalagens/min" }, { label: "Tipo de Máquina", value: "Semiautomática" }], images: [], youtubeUrl: "",
  },
  {
    id: "dm-008", name: "TDM100F - DOSADORA BANCADA P/ POS BX FLUIDEZ 10~100g", category: "Dosadoras", model: "TDM100F", next: "PAMQSLSA120", price: "Sob consulta", stockStatus: "in_stock", tags: [],
    specifications: [{ label: "Tipo de Produto", value: "Pós (Baixa Fluidez)" }, { label: "Dosagem", value: "10-100 g" }, { label: "Produtividade", value: "10-20 embalagens/min" }, { label: "Tipo de Máquina", value: "Semiautomática" }], images: [], youtubeUrl: "",
  },
  {
    id: "dm-009", name: "TDM100G - DOSADORA BANCADA P/ GRAOS 10~100g", category: "Dosadoras", model: "TDM100G", next: "PAMQSLSA111", price: "Sob consulta", stockStatus: "in_stock", tags: [],
    specifications: [{ label: "Tipo de Produto", value: "Grãos (Alta Fluidez)" }, { label: "Dosagem", value: "10-100 g" }, { label: "Produtividade", value: "10-20 embalagens/min" }, { label: "Tipo de Máquina", value: "Semiautomática" }], images: [], youtubeUrl: "",
  },
  {
    id: "dm-010", name: "TDM100P - DOSADORA BANCADA P/ POS 10~100g", category: "Dosadoras", model: "TDM100P", next: "PAMQSLSA114", price: "Sob consulta", stockStatus: "in_stock", tags: [],
    specifications: [{ label: "Tipo de Produto", value: "Pós (Alta Fluidez)" }, { label: "Dosagem", value: "10-100 g" }, { label: "Produtividade", value: "10-20 embalagens/min" }, { label: "Tipo de Máquina", value: "Semiautomática" }], images: [], youtubeUrl: "",
  },
  {
    id: "dm-011", name: "TDM100S - DOSADORA BANCADA P/ GRANULADOS 10~100g", category: "Dosadoras", model: "TDM100S", next: "PAMQSLSA117", price: "Sob consulta", stockStatus: "in_stock", tags: [],
    specifications: [{ label: "Tipo de Produto", value: "Granulados (Alta Fluidez)" }, { label: "Dosagem", value: "10-100 g" }, { label: "Produtividade", value: "10-20 embalagens/min" }, { label: "Tipo de Máquina", value: "Semiautomática" }], images: [], youtubeUrl: "",
  },
  {
    id: "dm-012", name: "TDM200G - DOSADORA BANCADA P/ GRAOS 20~200g", category: "Dosadoras", model: "TDM200G", next: "PAMQSLSA112", price: "Sob consulta", stockStatus: "in_stock", tags: [],
    specifications: [{ label: "Tipo de Produto", value: "Grãos (Alta Fluidez)" }, { label: "Dosagem", value: "20-200 g" }, { label: "Produtividade", value: "10-20 embalagens/min" }, { label: "Tipo de Máquina", value: "Semiautomática" }], images: [], youtubeUrl: "",
  },
  {
    id: "dm-013", name: "TDM200P - DOSADORA BANCADA P/ POS 20~200g", category: "Dosadoras", model: "TDM200P", next: "PAMQSLSA115", price: "Sob consulta", stockStatus: "in_stock", tags: [],
    specifications: [{ label: "Tipo de Produto", value: "Pós (Alta Fluidez)" }, { label: "Dosagem", value: "20-200 g" }, { label: "Produtividade", value: "10-20 embalagens/min" }, { label: "Tipo de Máquina", value: "Semiautomática" }], images: [], youtubeUrl: "",
  },
  {
    id: "dm-014", name: "TDM25F - DOSADORA BANCADA P/ POS BX FLUIDEZ 1~25g", category: "Dosadoras", model: "TDM25F", next: "PAMQSLSA119", price: "Sob consulta", stockStatus: "in_stock", tags: [],
    specifications: [{ label: "Tipo de Produto", value: "Dosadora (Baixa Fluidez)" }, { label: "Dosagem", value: "1-25 g" }, { label: "Produtividade", value: "10-20 embalagens/min" }, { label: "Tipo de Máquina", value: "Semiautomática" }], images: [], youtubeUrl: "",
  },
  {
    id: "dm-015", name: "TDM25G - DOSADORA BANCADA P/ GRAOS 1~25g", category: "Dosadoras", model: "TDM25G", next: "PAMQSLSA110", price: "Sob consulta", stockStatus: "in_stock", tags: [],
    specifications: [{ label: "Tipo de Produto", value: "Grãos (Alta Fluidez)" }, { label: "Dosagem", value: "1-25 g" }, { label: "Produtividade", value: "10-20 embalagens/min" }, { label: "Tipo de Máquina", value: "Semiautomática" }], images: [], youtubeUrl: "",
  },
  {
    id: "dm-016", name: "TDM25P - DOSADORA BANCADA P/ POS 1~25g", category: "Dosadoras", model: "TDM25P", next: "PAMQSLSA113", price: "Sob consulta", stockStatus: "in_stock", tags: [],
    specifications: [{ label: "Tipo de Produto", value: "Pós (Alta Fluidez)" }, { label: "Dosagem", value: "1-25 g" }, { label: "Produtividade", value: "10-20 embalagens/min" }, { label: "Tipo de Máquina", value: "Semiautomática" }], images: [], youtubeUrl: "",
  },
  {
    id: "dm-017", name: "TDM25S - DOSADORA BANCADA P/ GRANULADOS 1~25g", category: "Dosadoras", model: "TDM25S", next: "PAMQSLSA116", price: "Sob consulta", stockStatus: "in_stock", tags: [],
    specifications: [{ label: "Tipo de Produto", value: "Granulados (Alta Fluidez)" }, { label: "Dosagem", value: "1-25 g" }, { label: "Produtividade", value: "10-20 embalagens/min" }, { label: "Tipo de Máquina", value: "Semiautomática" }], images: [], youtubeUrl: "",
  },
  {
    id: "dm-018", name: "TDM500F - DOSADORA BANCADA P/ POS BX FLUIDEZ 50~500g", category: "Dosadoras", model: "TDM500F", next: "PAMQSLSA121", price: "Sob consulta", stockStatus: "in_stock", tags: [],
    specifications: [{ label: "Tipo de Produto", value: "Pós (Baixa Fluidez)" }, { label: "Dosagem", value: "50-500 g" }, { label: "Produtividade", value: "10-20 embalagens/min" }, { label: "Tipo de Máquina", value: "Semiautomática" }], images: [], youtubeUrl: "",
  },
  {
    id: "dm-019", name: "TDM500S - DOSADORA BANCADA P/ GRANULADOS 50~500g", category: "Dosadoras", model: "TDM500S", next: "PAMQSLSA118", price: "Sob consulta", stockStatus: "in_stock", tags: [],
    specifications: [{ label: "Tipo de Produto", value: "Granulados (Alta Fluidez)" }, { label: "Dosagem", value: "50-500 g" }, { label: "Produtividade", value: "10-20 embalagens/min" }, { label: "Tipo de Máquina", value: "Semiautomática" }], images: [], youtubeUrl: "",
  },

  // ========== EMPACOTADORAS AUTOMÁTICAS ==========
  {
    id: "emp-001", name: "AFPP1328 - EMPACOTADORA AUTOMATICA P/ POS ALIM. HORIZONTAL", category: "Empacotadoras", model: "AFPP1328", next: "PAMQGPAU050", price: "Sob consulta", stockStatus: "in_stock", tags: ["Automático"],
    specifications: [{ label: "Tipo de Produto", value: "Pós" }, { label: "Dosagem", value: "2-20 g" }, { label: "Comp. Embalagem", value: "50-130 mm" }, { label: "Produtividade", value: "35-50 embalagens/min" }, { label: "Tipo de Máquina", value: "Automática" }], images: [], youtubeUrl: "",
  },
  {
    id: "emp-002", name: "AFPP1328/P - EMPACOTADORA AUTOMATICA P/ POS C/ DOSAGEM PENDULAR", category: "Empacotadoras", model: "AFPP1328/P", next: "PAMQGPAU129", price: "Sob consulta", stockStatus: "in_stock", tags: ["Automático"],
    specifications: [{ label: "Tipo de Produto", value: "Pós" }, { label: "Dosagem", value: "1-10 g" }, { label: "Comp. Embalagem", value: "50-130 mm" }, { label: "Produtividade", value: "35-50 embalagens/min" }, { label: "Tipo de Máquina", value: "Automática" }], images: [], youtubeUrl: "",
  },
  {
    id: "emp-003", name: "AFPP1528A - EMPACOTADORA AUTOMATICA 4 SOLDAS P/ POS ALIM. CANECAS", category: "Empacotadoras", model: "AFPP1528A", next: "PAMQGPAU124", price: "Sob consulta", stockStatus: "in_stock", tags: ["Automático"],
    specifications: [{ label: "Tipo de Produto", value: "Pós" }, { label: "Dosagem", value: "10-100 g" }, { label: "Comp. Embalagem", value: "50-150 mm" }, { label: "Produtividade", value: "35-50 embalagens/min" }, { label: "Tipo de Máquina", value: "Automática" }], images: [], youtubeUrl: "",
  },
  {
    id: "emp-004", name: "AFPP2030B - EMPACOTADORA AUTOMATICA P/ POS", category: "Empacotadoras", model: "AFPP2030B", next: "PAMQGPAU076", price: "Sob consulta", stockStatus: "in_stock", tags: ["Automático"],
    specifications: [{ label: "Tipo de Produto", value: "Pós" }, { label: "Dosagem", value: "≤ 60 g" }, { label: "Comp. Embalagem", value: "50-200 mm" }, { label: "Produtividade", value: "35-50 embalagens/min" }, { label: "Tipo de Máquina", value: "Automática" }], images: [], youtubeUrl: "",
  },
  {
    id: "emp-005", name: "AFPP220A - ENVASADORA DE LIQ./PAST. EM EMBALAGENS ESPECIAIS", category: "Empacotadoras", model: "AFPP220A", next: "PAMQGPAU104", price: "Sob consulta", stockStatus: "in_stock", tags: ["Automático"],
    specifications: [{ label: "Dosagem", value: "5-20 ml" }, { label: "Comp. Embalagem", value: "120-280 mm" }, { label: "Formato", value: "Selagem contínua" }, { label: "Produtividade", value: "15-25 embalagens/min" }, { label: "Tipo de Máquina", value: "Automática" }], images: [], youtubeUrl: "",
  },
  {
    id: "emp-006", name: "AFPP2830B - EMPACOTADORA AUTOMATICA P/ SACHE TIPO STICK", category: "Empacotadoras", model: "AFPP2830B", next: "PAMQGPAU077", price: "Sob consulta", stockStatus: "in_stock", tags: ["Automático"],
    specifications: [{ label: "Dosagem", value: "10-30 g" }, { label: "Comp. Embalagem", value: "45-150 mm" }, { label: "Formato", value: "Sache Tipo Stick" }, { label: "Produtividade", value: "25-35 embalagens/min" }, { label: "Tipo de Máquina", value: "Automática" }], images: [], youtubeUrl: "",
  },
  {
    id: "emp-007", name: "AFPP320B - EMPACOTADORA AUTOMATICA C/ BALANCA LINEAR 4 CABECAS", category: "Empacotadoras", model: "AFPP320B", next: "PAMQGPAU054", price: "Sob consulta", stockStatus: "in_stock", tags: ["Automático"],
    specifications: [{ label: "Dosagem", value: "10-100 g" }, { label: "Comp. Embalagem", value: "50-200 mm" }, { label: "Largura Máx. Bobina", value: "320 mm" }, { label: "Produtividade", value: "20-50 embalagens/min" }, { label: "Tipo de Máquina", value: "Automática" }], images: [], youtubeUrl: "",
  },
  {
    id: "emp-008", name: "AFPP320C - EMPACOTADORA AUT. VERTICAL 10 CABECAS C/ BAL. ELETRONICA", category: "Empacotadoras", model: "AFPP320C", next: "PAMQGPAU034", price: "Sob consulta", stockStatus: "in_stock", tags: ["Automático"],
    specifications: [{ label: "Dosagem", value: "500-1000 g" }, { label: "Comp. Embalagem", value: "50-200 mm" }, { label: "Largura Máx. Bobina", value: "320 mm" }, { label: "Produtividade", value: "15-70 embalagens/min" }, { label: "Tipo de Máquina", value: "Automática" }], images: [], youtubeUrl: "",
  },
  {
    id: "emp-009", name: "AFPP420E - EMPACOTADORA AUTOMATICA DE ALTO DESEMPENHO P/ POS", category: "Empacotadoras", model: "AFPP420E", next: "PAMQGPAU152", price: "Sob consulta", stockStatus: "in_stock", tags: ["Automático"],
    specifications: [{ label: "Tipo de Produto", value: "Pós" }, { label: "Dosagem", value: "300-1000 g" }, { label: "Comp. Embalagem", value: "300 mm" }, { label: "Largura Máx. Bobina", value: "420 mm" }, { label: "Produtividade", value: "20-40 embalagens/min" }, { label: "Tipo de Máquina", value: "Automática" }], images: [], youtubeUrl: "",
  },
  {
    id: "emp-010", name: "AFPP420F - EMPACOTADORA AUTOMATICA DE ALTO DESEMPENHO", category: "Empacotadoras", model: "AFPP420F", next: "PAMQGPAU151", price: "Sob consulta", stockStatus: "in_stock", tags: ["Automático"],
    specifications: [{ label: "Dosagem", value: "300-1000 ml" }, { label: "Comp. Embalagem", value: "300 mm" }, { label: "Largura Máx. Bobina", value: "420 mm" }, { label: "Produtividade", value: "25-40 embalagens/min" }, { label: "Tipo de Máquina", value: "Automática" }], images: [], youtubeUrl: "",
  },
  {
    id: "emp-011", name: "SW180A - EMPACOTADORA C/ 4 BALANCAS VIBR. P/ STAND UP POUCH", category: "Empacotadoras", model: "SW180A", next: "PAMQGPAU153", price: "Sob consulta", stockStatus: "in_stock", tags: ["Automático"],
    specifications: [{ label: "Dosagem", value: "50-500 g" }, { label: "Comp. Embalagem", value: "110-300 mm" }, { label: "Formato", value: "Stand Up Pouch" }, { label: "Produtividade", value: "5-30 embalagens/min" }, { label: "Tipo de Máquina", value: "Automática" }], images: [], youtubeUrl: "",
  },
  {
    id: "emp-012", name: "SW200 - EMPACOTADORA STAND_UP POUCH P/ POS", category: "Empacotadoras", model: "SW200", next: "PAMQGPAU078", price: "Sob consulta", stockStatus: "in_stock", tags: ["Automático"],
    specifications: [{ label: "Tipo de Produto", value: "Pós" }, { label: "Dosagem", value: "200-1500 g" }, { label: "Comp. Embalagem", value: "100-300 mm" }, { label: "Formato", value: "Stand Up Pouch" }, { label: "Produtividade", value: "16-50 embalagens/min" }, { label: "Tipo de Máquina", value: "Automática" }], images: [], youtubeUrl: "",
  },
  {
    id: "emp-013", name: "SW250 - EMPACOTADORA STAND_UP POUCH P/ POS", category: "Empacotadoras", model: "SW250", next: "PAMQGPAU081", price: "Sob consulta", stockStatus: "in_stock", tags: ["Automático"],
    specifications: [{ label: "Tipo de Produto", value: "Pós" }, { label: "Dosagem", value: "200-2000 g" }, { label: "Comp. Embalagem", value: "100-350 mm" }, { label: "Formato", value: "Stand Up Pouch" }, { label: "Produtividade", value: "16-40 embalagens/min" }, { label: "Tipo de Máquina", value: "Automática" }], images: [], youtubeUrl: "",
  },
  {
    id: "emp-014", name: "SW320 - EMPACOTADORA STAND_UP POUCH P/ POS", category: "Empacotadoras", model: "SW320", next: "PAMQGPAU126", price: "Sob consulta", stockStatus: "in_stock", tags: ["Automático"],
    specifications: [{ label: "Tipo de Produto", value: "Pós" }, { label: "Dosagem", value: "500-2500 g" }, { label: "Comp. Embalagem", value: "100-480 mm" }, { label: "Formato", value: "Stand Up Pouch" }, { label: "Produtividade", value: "10-30 embalagens/min" }, { label: "Tipo de Máquina", value: "Automática" }], images: [], youtubeUrl: "",
  },

  // ========== ENCAPSULADORAS ==========
  {
    id: "enc-001", name: "UNION - ENCAPSULADORA SEMI-AUTOM. P/ PO PAINEL ANALOG.", category: "Encapsuladoras", model: "UNION", next: "PAMQSLSA018", price: "Sob consulta", stockStatus: "in_stock", tags: ["Automático"],
    specifications: [{ label: "Tipo de Produto", value: "Cápsulas #000-#5" }, { label: "Produtividade", value: "25000 cápsulas/hora" }, { label: "Tipo de Máquina", value: "Automática" }], images: [], youtubeUrl: "",
  },
  {
    id: "enc-002", name: "UNION PLUS - ENCAPSULADORA SEMI-AUTOM. P/ PO C/ CLP", category: "Encapsuladoras", model: "UNION PLUS", next: "PAMQSLSA033", price: "Sob consulta", stockStatus: "in_stock", tags: ["Automático"],
    specifications: [{ label: "Tipo de Produto", value: "Cápsulas #000-#5" }, { label: "Produtividade", value: "25000 cápsulas/hora" }, { label: "Tipo de Máquina", value: "Automática" }], images: [], youtubeUrl: "",
  },
  {
    id: "enc-003", name: "UNION PLUS/II - ENCAPSULADORA SEMI-AUTOM. P/ PO C/ CLP", category: "Encapsuladoras", model: "UNION PLUS/II", next: "PAMQSLSA017", price: "Sob consulta", stockStatus: "in_stock", tags: ["Automático"],
    specifications: [{ label: "Tipo de Produto", value: "Cápsulas #000-#5" }, { label: "Produtividade", value: "25000 cápsulas/hora" }, { label: "Tipo de Máquina", value: "Automática" }], images: [], youtubeUrl: "",
  },
  {
    id: "enc-004", name: "FUSION 400 - ENCAPSULADORA AUTOMATICA", category: "Encapsuladoras", model: "FUSION 400", next: "PAMQSLSA018", price: "Sob consulta", stockStatus: "in_stock", tags: ["Automático"],
    specifications: [{ label: "Tipo de Produto", value: "Cápsulas 00L#-#5" }, { label: "Produtividade", value: "400 cápsulas/min" }, { label: "Tipo de Máquina", value: "Automática" }], images: [], youtubeUrl: "",
  },
  {
    id: "enc-005", name: "FUSION 800 - ENCAPSULADORA AUTOMATICA", category: "Encapsuladoras", model: "FUSION 800", next: "PAMQSLSA033", price: "Sob consulta", stockStatus: "in_stock", tags: ["Automático"],
    specifications: [{ label: "Tipo de Produto", value: "Cápsulas 00L#-#5" }, { label: "Produtividade", value: "800 cápsulas/min" }, { label: "Tipo de Máquina", value: "Automática" }], images: [], youtubeUrl: "",
  },
  {
    id: "enc-006", name: "FUSION 1200 - ENCAPSULADORA AUTOMATICA", category: "Encapsuladoras", model: "FUSION 1200", next: "PAMQSLSA017", price: "Sob consulta", stockStatus: "in_stock", tags: ["Automático"],
    specifications: [{ label: "Tipo de Produto", value: "Cápsulas 00L#-#5" }, { label: "Produtividade", value: "1200 cápsulas/min" }, { label: "Tipo de Máquina", value: "Automática" }], images: [], youtubeUrl: "",
  },
  {
    id: "enc-007", name: "FUSION 2500 - ENCAPSULADORA AUTOMATICA", category: "Encapsuladoras", model: "FUSION 2500", next: "PAMQSLSA025", price: "Sob consulta", stockStatus: "in_stock", tags: ["Automático"],
    specifications: [{ label: "Tipo de Produto", value: "Cápsulas 00L#-#5" }, { label: "Produtividade", value: "2500 cápsulas/min" }, { label: "Tipo de Máquina", value: "Automática" }], images: [], youtubeUrl: "",
  },
  {
    id: "enc-008", name: "FUSION 3500 - ENCAPSULADORA AUTOMATICA", category: "Encapsuladoras", model: "FUSION 3500", next: "PAMQSLSA039", price: "Sob consulta", stockStatus: "in_stock", tags: ["Automático"],
    specifications: [{ label: "Tipo de Produto", value: "Cápsulas 00L#-#5" }, { label: "Produtividade", value: "3500 cápsulas/min" }, { label: "Tipo de Máquina", value: "Automática" }], images: [], youtubeUrl: "",
  },

  // ========== ENCARTUCHADEIRA ==========
  {
    id: "encart-001", name: "ZH-50 - ENCARTUCHADEIRA ROTATIVA VERTICAL", category: "Encartuchadeira Rotativa", model: "ZH-50", next: "PAMQCCAU007", price: "Sob consulta", stockStatus: "in_stock", tags: ["Automático"],
    specifications: [{ label: "Produto", value: "Frasco" }, { label: "Embalagem", value: "Caixa" }, { label: "Tam. Mín. Caixa", value: "60×20×20 mm" }, { label: "Tam. Máx. Caixa", value: "200×80×80 mm" }, { label: "Produtividade", value: "20-50 caixas/min" }, { label: "Tipo de Máquina", value: "Automática" }], images: [], youtubeUrl: "",
  },

  // ========== ENVASADORAS (Part 1) ==========
  {
    id: "env-001", name: "HZK160 - ENVASADORA PERISTALTICA P/ LIQUIDOS VOL. 5-3500ML", category: "Envasadoras", model: "HZK160", next: "PAMQLQAU038", price: "Sob consulta", stockStatus: "in_stock", tags: [],
    specifications: [{ label: "Tipo de Produto", value: "Líquido" }, { label: "Volume Min", value: "5 ml" }, { label: "Volume Max", value: "3500 ml" }, { label: "Produtividade", value: "2000 ml/min" }, { label: "Tipo de Máquina", value: "Semiautomática" }], images: [], youtubeUrl: "",
  },
  {
    id: "env-002", name: "DGF 1000 - ENVASADORA SEMI-AUTOM. P/ LIQ. E PAST. 100-1000ML", category: "Envasadoras", model: "DGF 1000", next: "PAMQLQAU007", price: "Sob consulta", stockStatus: "in_stock", tags: [],
    specifications: [{ label: "Tipo de Produto", value: "Líquido/Pastoso" }, { label: "Volume Min", value: "100 ml" }, { label: "Volume Max", value: "1000 ml" }, { label: "Produtividade", value: "5-30 ciclos/min" }, { label: "Tipo de Máquina", value: "Semiautomática" }], images: [], youtubeUrl: "",
  },
  {
    id: "env-003", name: "DGF 500 - ENVASADORA SEMI AUTOM. P/ LIQ. E PAST. 50-500ML", category: "Envasadoras", model: "DGF 500", next: "PAMQLQAU003", price: "Sob consulta", stockStatus: "in_stock", tags: [],
    specifications: [{ label: "Tipo de Produto", value: "Líquido/Pastoso" }, { label: "Volume Min", value: "50 ml" }, { label: "Volume Max", value: "500 ml" }, { label: "Produtividade", value: "5-30 ciclos/min" }, { label: "Tipo de Máquina", value: "Semiautomática" }], images: [], youtubeUrl: "",
  },
  {
    id: "env-004", name: "DGF 100 - ENVASADORA SEMI-AUTOM. P/ LIQ. E PAST. 10-100ML", category: "Envasadoras", model: "DGF 100", next: "PAMQLQAU005", price: "Sob consulta", stockStatus: "in_stock", tags: [],
    specifications: [{ label: "Tipo de Produto", value: "Líquido/Pastoso" }, { label: "Volume Min", value: "10 ml" }, { label: "Volume Max", value: "100 ml" }, { label: "Produtividade", value: "5-30 ciclos/min" }, { label: "Tipo de Máquina", value: "Semiautomática" }], images: [], youtubeUrl: "",
  },
  {
    id: "env-005", name: "A3 - ENVASADORA POR PRESSAO MANUAL 50ML", category: "Envasadoras", model: "A3", next: "PAMQLQAU108", price: "Sob consulta", stockStatus: "in_stock", tags: ["Manual"],
    specifications: [{ label: "Tipo de Produto", value: "Pastoso" }, { label: "Volume Min", value: "5 ml" }, { label: "Volume Max", value: "50 ml" }, { label: "Produtividade", value: "1500 ml/min" }, { label: "Tipo de Máquina", value: "Manual" }], images: [], youtubeUrl: "",
  },
  {
    id: "env-006", name: "GENIUS 8 - ENVASADORA E CONTADORA ELETRONICA DE CAPSULAS", category: "Envasadoras", model: "GENIUS 8", next: "PAACSLAU226", price: "Sob consulta", stockStatus: "in_stock", tags: ["Automático"],
    specifications: [{ label: "Tipo de Produto", value: "Cápsulas/Softgel/Comprimidos" }, { label: "Produtividade", value: "10-30 frascos/min" }, { label: "Tipo de Máquina", value: "Automática" }], images: [], youtubeUrl: "",
  },
  {
    id: "env-007", name: "APF1000-4B - ENVASADORA AUTOM. 4 BICOS P/ LIQ./PAST. 100/1000ML", category: "Envasadoras", model: "APF1000-4B", next: "PAMQLQAU019", price: "Sob consulta", stockStatus: "in_stock", tags: ["Automático"],
    specifications: [{ label: "Tipo de Produto", value: "Líquido/Pastoso" }, { label: "Volume Min", value: "100 ml" }, { label: "Volume Max", value: "1000 ml" }, { label: "Produtividade", value: "15-35 ciclos/min (por bico)" }, { label: "Tipo de Máquina", value: "Automática" }], images: [], youtubeUrl: "",
  },
  {
    id: "env-008", name: "APF5000-4B - ENVASADORA AUTOM. 4 BICOS P/ LIQ./PAST. 1000/5000ML", category: "Envasadoras", model: "APF5000-4B", next: "PAMQLQAU043", price: "Sob consulta", stockStatus: "in_stock", tags: ["Automático"],
    specifications: [{ label: "Tipo de Produto", value: "Líquido/Pastoso" }, { label: "Volume Min", value: "1000 ml" }, { label: "Volume Max", value: "5000 ml" }, { label: "Produtividade", value: "15-35 ciclos/min (por bico)" }, { label: "Tipo de Máquina", value: "Automática" }], images: [], youtubeUrl: "",
  },
  {
    id: "env-009", name: "VSF-30S - ENVASADORA SEMIAUTOMATICA C/ ESCALA VOLUMETRICA P/ POS", category: "Envasadoras", model: "VSF-30S", next: "PAMQGPAU036", price: "Sob consulta", stockStatus: "in_stock", tags: [],
    specifications: [{ label: "Tipo de Produto", value: "Pó" }, { label: "Volume Min", value: "300 g" }, { label: "Produtividade", value: "1600 frascos/hora" }, { label: "Tipo de Máquina", value: "Semiautomática" }], images: [], youtubeUrl: "",
  },
  {
    id: "env-010", name: "APF100-2B - ENVASADORA AUTOM. 2 BICOS P/ LIQ./PAST. 5/100ML", category: "Envasadoras", model: "APF100-2B", next: "PAMQLQAU044", price: "Sob consulta", stockStatus: "in_stock", tags: ["Automático"],
    specifications: [{ label: "Tipo de Produto", value: "Líquido/Pastoso" }, { label: "Volume Min", value: "5 ml" }, { label: "Volume Max", value: "100 ml" }, { label: "Produtividade", value: "15-35 ciclos/min (por bico)" }, { label: "Tipo de Máquina", value: "Automática" }], images: [], youtubeUrl: "",
  },
  {
    id: "env-011", name: "APF1000-2B - ENVASADORA AUTOM. 2 BICOS P/ LIQ./PAST. 100/1000ML", category: "Envasadoras", model: "APF1000-2B", next: "PAMQLQAU047", price: "Sob consulta", stockStatus: "in_stock", tags: ["Automático"],
    specifications: [{ label: "Tipo de Produto", value: "Líquido/Pastoso" }, { label: "Volume Min", value: "5 ml" }, { label: "Volume Max", value: "100 ml" }, { label: "Produtividade", value: "15-35 ciclos/min (por bico)" }, { label: "Tipo de Máquina", value: "Automática" }], images: [], youtubeUrl: "",
  },
  {
    id: "env-012", name: "APF1000-6B - ENVASADORA AUTOM. 6 BICOS P/ LIQ./PAST. 100/1000ML", category: "Envasadoras", model: "APF1000-6B", next: "PAMQLQAU053", price: "Sob consulta", stockStatus: "in_stock", tags: ["Automático"],
    specifications: [{ label: "Tipo de Produto", value: "Líquido/Pastoso" }, { label: "Volume Min", value: "5 ml" }, { label: "Volume Max", value: "100 ml" }, { label: "Produtividade", value: "15-35 ciclos/min (por bico)" }, { label: "Tipo de Máquina", value: "Automática" }], images: [], youtubeUrl: "",
  },
  {
    id: "env-013", name: "APF300-2B - ENVASADORA AUTOM. 2 BICOS P/ LIQ./PAST. 30/300ML", category: "Envasadoras", model: "APF300-2B", next: "PAMQLQAU045", price: "Sob consulta", stockStatus: "in_stock", tags: ["Automático"],
    specifications: [{ label: "Tipo de Produto", value: "Líquido/Pastoso" }, { label: "Volume Min", value: "30 ml" }, { label: "Volume Max", value: "300 ml" }, { label: "Produtividade", value: "15-35 ciclos/min (por bico)" }, { label: "Tipo de Máquina", value: "Automática" }], images: [], youtubeUrl: "",
  },
  {
    id: "env-014", name: "APF300-4B - ENVASADORA AUTOM. 4 BICOS P/ LIQ./PAST. 30/300ML", category: "Envasadoras", model: "APF300-4B", next: "PAMQLQAU040", price: "Sob consulta", stockStatus: "in_stock", tags: ["Automático"],
    specifications: [{ label: "Tipo de Produto", value: "Líquido/Pastoso" }, { label: "Volume Min", value: "30 ml" }, { label: "Volume Max", value: "300 ml" }, { label: "Produtividade", value: "15-35 ciclos/min (por bico)" }, { label: "Tipo de Máquina", value: "Automática" }], images: [], youtubeUrl: "",
  },
  {
    id: "env-015", name: "APF500-2B - ENVASADORA AUTOM. 2 BICOS P/ LIQ./PAST. 50/500ML", category: "Envasadoras", model: "APF500-2B", next: "PAMQLQAU046", price: "Sob consulta", stockStatus: "in_stock", tags: ["Automático"],
    specifications: [{ label: "Tipo de Produto", value: "Líquido/Pastoso" }, { label: "Volume Min", value: "50 ml" }, { label: "Volume Max", value: "500 ml" }, { label: "Produtividade", value: "15-35 ciclos/min (por bico)" }, { label: "Tipo de Máquina", value: "Automática" }], images: [], youtubeUrl: "",
  },
  {
    id: "env-016", name: "APF500-4B - ENVASADORA AUTOM. 4 BICOS P/ LIQ./PAST. 50/500ML", category: "Envasadoras", model: "APF500-4B", next: "PAMQLQAU041", price: "Sob consulta", stockStatus: "in_stock", tags: ["Automático"],
    specifications: [{ label: "Tipo de Produto", value: "Líquido/Pastoso" }, { label: "Volume Min", value: "50 ml" }, { label: "Volume Max", value: "500 ml" }, { label: "Produtividade", value: "15-35 ciclos/min (por bico)" }, { label: "Tipo de Máquina", value: "Automática" }], images: [], youtubeUrl: "",
  },
  {
    id: "env-017", name: "APF2500-2B - ENVASADORA AUTOM. 2 BICOS P/ LIQ./PAST. 300/2500ML", category: "Envasadoras", model: "APF2500-2B", next: "PAMQLQAU048", price: "Sob consulta", stockStatus: "in_stock", tags: ["Automático"],
    specifications: [{ label: "Tipo de Produto", value: "Líquido/Pastoso" }, { label: "Volume Min", value: "300 ml" }, { label: "Volume Max", value: "2500 ml" }, { label: "Produtividade", value: "15-35 ciclos/min (por bico)" }, { label: "Tipo de Máquina", value: "Automática" }], images: [], youtubeUrl: "",
  },
  {
    id: "env-018", name: "APF2500-4B - ENVASADORA AUTOM. 4 BICOS P/ LIQ./PAST. 300/2500ML", category: "Envasadoras", model: "APF2500-4B", next: "PAMQLQAU042", price: "Sob consulta", stockStatus: "in_stock", tags: ["Automático"],
    specifications: [{ label: "Tipo de Produto", value: "Líquido/Pastoso" }, { label: "Volume Min", value: "300 ml" }, { label: "Volume Max", value: "2500 ml" }, { label: "Produtividade", value: "15-35 ciclos/min (por bico)" }, { label: "Tipo de Máquina", value: "Automática" }], images: [], youtubeUrl: "",
  },
  {
    id: "env-019", name: "APF5000-2B - ENVASADORA AUTOM. 2 BICOS P/ LIQ./PAST. 1000/5000ML", category: "Envasadoras", model: "APF5000-2B", next: "PAMQLQAU049", price: "Sob consulta", stockStatus: "in_stock", tags: ["Automático"],
    specifications: [{ label: "Tipo de Produto", value: "Líquido/Pastoso" }, { label: "Volume Min", value: "1000 ml" }, { label: "Volume Max", value: "5000 ml" }, { label: "Produtividade", value: "15-35 ciclos/min (por bico)" }, { label: "Tipo de Máquina", value: "Automática" }], images: [], youtubeUrl: "",
  },
  {
    id: "env-020", name: "DGF 300 - ENVASADORA SEMI-AUTOM. P/ LIQ. E PAST. 30-300ML", category: "Envasadoras", model: "DGF 300", next: "PAMQLQAU006", price: "Sob consulta", stockStatus: "in_stock", tags: [],
    specifications: [{ label: "Tipo de Produto", value: "Líquido/Pastoso" }, { label: "Volume Min", value: "30 ml" }, { label: "Volume Max", value: "300 ml" }, { label: "Produtividade", value: "5-30 ciclos/min" }, { label: "Tipo de Máquina", value: "Semiautomática" }], images: [], youtubeUrl: "",
  },
  {
    id: "env-021", name: "DGF 2500 - ENVASADORA SEMI-AUTOM. P/ LIQ. E PAST. 300-2500ML", category: "Envasadoras", model: "DGF 2500", next: "PAMQLQAU008", price: "Sob consulta", stockStatus: "in_stock", tags: [],
    specifications: [{ label: "Tipo de Produto", value: "Líquido/Pastoso" }, { label: "Volume Min", value: "300 ml" }, { label: "Volume Max", value: "2500 ml" }, { label: "Produtividade", value: "5-30 ciclos/min" }, { label: "Tipo de Máquina", value: "Semiautomática" }], images: [], youtubeUrl: "",
  },
  {
    id: "env-022", name: "DGF 5000 - ENVASADORA SEMI-AUTOM. P/ LIQ. E PAST. 500-5000ML", category: "Envasadoras", model: "DGF 5000", next: "PAMQLQAU009", price: "Sob consulta", stockStatus: "in_stock", tags: [],
    specifications: [{ label: "Tipo de Produto", value: "Líquido/Pastoso" }, { label: "Volume Min", value: "500 ml" }, { label: "Volume Max", value: "5000 ml" }, { label: "Produtividade", value: "5-30 ciclos/min" }, { label: "Tipo de Máquina", value: "Semiautomática" }], images: [], youtubeUrl: "",
  },
  {
    id: "env-023", name: "GENIUS 2 - ENVASADORA E CONTADORA SEMI AUTOMATICA DE CAPSULAS", category: "Envasadoras", model: "GENIUS 2", next: "PAACSLAU146", price: "Sob consulta", stockStatus: "in_stock", tags: [],
    specifications: [{ label: "Tipo de Produto", value: "Cápsulas/Softgel/Comprimidos" }, { label: "Produtividade", value: "600-1500 cápsulas/min" }, { label: "Tipo de Máquina", value: "Semiautomática" }], images: [], youtubeUrl: "",
  },
  {
    id: "env-024", name: "GENIUS 16 - ENVASADORA E CONTADORA ELETRONICA P/ PROD. IRREGULARES", category: "Envasadoras", model: "GENIUS 16", next: "PAACSLAU223", price: "Sob consulta", stockStatus: "in_stock", tags: ["Automático"],
    specifications: [{ label: "Tipo de Produto", value: "Cápsulas/Softgel/Comprimidos" }, { label: "Produtividade", value: "50-60 frascos/min" }, { label: "Tipo de Máquina", value: "Automática" }], images: [], youtubeUrl: "",
  },
  {
    id: "env-025", name: "VSF-30A - ENVASADORA AUTOM. P/ POS C/ ESCALA VOL.", category: "Envasadoras", model: "VSF-30A", next: "PAMQGPAU037", price: "Sob consulta", stockStatus: "in_stock", tags: ["Automático"],
    specifications: [{ label: "Tipo de Produto", value: "Pó" }, { label: "Volume Min", value: "10 g" }, { label: "Volume Max", value: "5000 g" }, { label: "Produtividade", value: "1-30 frascos/min" }, { label: "Tipo de Máquina", value: "Automática" }], images: [], youtubeUrl: "",
  },
  {
    id: "env-026", name: "VSF - ENVASADORA SEMI AUTOMATICA PARA POS", category: "Envasadoras", model: "VSF", next: "PAMQGPAU079", price: "Sob consulta", stockStatus: "in_stock", tags: [],
    specifications: [{ label: "Tipo de Produto", value: "Pó" }, { label: "Volume Min", value: "1 g" }, { label: "Volume Max", value: "20 g" }, { label: "Produtividade", value: "2-20 frascos/min" }, { label: "Tipo de Máquina", value: "Semiautomática" }], images: [], youtubeUrl: "",
  },
  {
    id: "env-027", name: "VSF-30AGII - ENVAS. AUTOM. P/ POS C/ ESCALA VOL. EST. TRANSP.", category: "Envasadoras", model: "VSF-30AGII", next: "PAMQGPAU060", price: "Sob consulta", stockStatus: "in_stock", tags: ["Automático"],
    specifications: [{ label: "Tipo de Produto", value: "Pó" }, { label: "Volume Min", value: "10 g" }, { label: "Volume Max", value: "5000 g" }, { label: "Produtividade", value: "2-20 frascos/min" }, { label: "Tipo de Máquina", value: "Automática" }], images: [], youtubeUrl: "",
  },
  {
    id: "env-028", name: "DGF2 100 - ENVASADORA SEMI-AUT. P/ LIQ/PAST. 10-100ML", category: "Envasadoras", model: "DGF2 100", next: "PAMQLQAU015", price: "Sob consulta", stockStatus: "in_stock", tags: [],
    specifications: [{ label: "Tipo de Produto", value: "Líquido/Pastoso" }, { label: "Volume Min", value: "10 ml" }, { label: "Volume Max", value: "100 ml" }, { label: "Produtividade", value: "5-30 ciclos/min (por bico)" }, { label: "Tipo de Máquina", value: "Semiautomática" }], images: [], youtubeUrl: "",
  },
  {
    id: "env-029", name: "DGF2 300 - ENVASADORA SEMI-AUT. P/ LIQ-PAST. 30-300ML", category: "Envasadoras", model: "DGF2 300", next: "PAMQLQAU017", price: "Sob consulta", stockStatus: "in_stock", tags: [],
    specifications: [{ label: "Tipo de Produto", value: "Líquido/Pastoso" }, { label: "Volume Min", value: "30 ml" }, { label: "Volume Max", value: "300 ml" }, { label: "Produtividade", value: "5-30 ciclos/min (por bico)" }, { label: "Tipo de Máquina", value: "Semiautomática" }], images: [], youtubeUrl: "",
  },
  {
    id: "env-030", name: "DGF2 500 - ENVASADORA SEMI-AUTO. 2 BICOS 50-500ML", category: "Envasadoras", model: "DGF2 500", next: "PAMQLQAU022", price: "Sob consulta", stockStatus: "in_stock", tags: [],
    specifications: [{ label: "Tipo de Produto", value: "Líquido/Pastoso" }, { label: "Volume Min", value: "50 ml" }, { label: "Volume Max", value: "500 ml" }, { label: "Produtividade", value: "5-30 ciclos/min (por bico)" }, { label: "Tipo de Máquina", value: "Semiautomática" }], images: [], youtubeUrl: "",
  },

  // ========== ENVASADORAS (Part 2) ==========
  {
    id: "env-031", name: "DGF2 1000 - ENVASADORA SEMI-AUT. P/ LIQ-PAST. 100-1000ML", category: "Envasadoras", model: "DGF2 1000", next: "PAMQLQAU016", price: "Sob consulta", stockStatus: "in_stock", tags: [],
    specifications: [{ label: "Tipo de Produto", value: "Líquido/Pastoso" }, { label: "Volume Min", value: "100 ml" }, { label: "Volume Max", value: "1000 ml" }, { label: "Produtividade", value: "5-30 ciclos/min (por bico)" }, { label: "Tipo de Máquina", value: "Semiautomática" }], images: [], youtubeUrl: "",
  },
  {
    id: "env-032", name: "DGF2 2500 - ENVASADORA SEMI-AUT. P/ LIQ-PAST. 300-2500ML", category: "Envasadoras", model: "DGF2 2500", next: "PAMQLQAU090", price: "Sob consulta", stockStatus: "in_stock", tags: [],
    specifications: [{ label: "Tipo de Produto", value: "Líquido/Pastoso" }, { label: "Volume Min", value: "300 ml" }, { label: "Volume Max", value: "2500 ml" }, { label: "Produtividade", value: "5-30 ciclos/min (por bico)" }, { label: "Tipo de Máquina", value: "Semiautomática" }], images: [], youtubeUrl: "",
  },
  {
    id: "env-033", name: "DGF2 5000 - ENVASADORA SEMI-AUT. P/ LIQ-PAST. 500-5000ML", category: "Envasadoras", model: "DGF2 5000", next: "PAMQLQAU091", price: "Sob consulta", stockStatus: "in_stock", tags: [],
    specifications: [{ label: "Tipo de Produto", value: "Líquido/Pastoso" }, { label: "Volume Min", value: "500 ml" }, { label: "Volume Max", value: "5000 ml" }, { label: "Produtividade", value: "5-30 ciclos/min (por bico)" }, { label: "Tipo de Máquina", value: "Semiautomática" }], images: [], youtubeUrl: "",
  },
  {
    id: "env-034", name: "SYF 100 - ENVASADORA SEMI-AUT. P/ LIQUIDOS 10-100ML", category: "Envasadoras", model: "SYF 100", next: "PAMQLQAU010", price: "Sob consulta", stockStatus: "in_stock", tags: [],
    specifications: [{ label: "Tipo de Produto", value: "Líquido" }, { label: "Volume Min", value: "10 ml" }, { label: "Volume Max", value: "100 ml" }, { label: "Produtividade", value: "5-30 ciclos/min" }, { label: "Tipo de Máquina", value: "Semiautomática" }], images: [], youtubeUrl: "",
  },
  {
    id: "env-035", name: "SYF 300 - ENVASADORA SEMI-AUT. P/ LIQUIDOS 30-300ML", category: "Envasadoras", model: "SYF 300", next: "PAMQLQAU011", price: "Sob consulta", stockStatus: "in_stock", tags: [],
    specifications: [{ label: "Tipo de Produto", value: "Líquido" }, { label: "Volume Min", value: "30 ml" }, { label: "Volume Max", value: "300 ml" }, { label: "Produtividade", value: "5-30 ciclos/min" }, { label: "Tipo de Máquina", value: "Semiautomática" }], images: [], youtubeUrl: "",
  },
  {
    id: "env-036", name: "SYF 500 - ENVASADORA SEMI-AUT. P/ LIQUIDOS 50-500ML", category: "Envasadoras", model: "SYF 500", next: "PAMQLQAU004", price: "Sob consulta", stockStatus: "in_stock", tags: [],
    specifications: [{ label: "Tipo de Produto", value: "Líquido" }, { label: "Volume Min", value: "50 ml" }, { label: "Volume Max", value: "500 ml" }, { label: "Produtividade", value: "5-30 ciclos/min" }, { label: "Tipo de Máquina", value: "Semiautomática" }], images: [], youtubeUrl: "",
  },
  {
    id: "env-037", name: "SYF 1000 - ENVASADORA SEMI-AUT. P/ LIQUIDOS 100-1000ML", category: "Envasadoras", model: "SYF 1000", next: "PAMQLQAU012", price: "Sob consulta", stockStatus: "in_stock", tags: [],
    specifications: [{ label: "Tipo de Produto", value: "Líquido" }, { label: "Volume Min", value: "100 ml" }, { label: "Volume Max", value: "1000 ml" }, { label: "Produtividade", value: "5-30 ciclos/min" }, { label: "Tipo de Máquina", value: "Semiautomática" }], images: [], youtubeUrl: "",
  },
  {
    id: "env-038", name: "SYF 2500 - ENVASADORA SEMI-AUT. P/ LIQUIDOS 300-2500ML", category: "Envasadoras", model: "SYF 2500", next: "PAMQLQAU013", price: "Sob consulta", stockStatus: "in_stock", tags: [],
    specifications: [{ label: "Tipo de Produto", value: "Líquido" }, { label: "Volume Min", value: "300 ml" }, { label: "Volume Max", value: "2500 ml" }, { label: "Produtividade", value: "5-30 ciclos/min" }, { label: "Tipo de Máquina", value: "Semiautomática" }], images: [], youtubeUrl: "",
  },
  {
    id: "env-039", name: "SYF 5000 - ENVASADORA SEMI-AUT. P/ LIQUIDOS 500-5000ML", category: "Envasadoras", model: "SYF 5000", next: "PAMQLQAU014", price: "Sob consulta", stockStatus: "in_stock", tags: [],
    specifications: [{ label: "Tipo de Produto", value: "Líquido" }, { label: "Volume Min", value: "500 ml" }, { label: "Volume Max", value: "5000 ml" }, { label: "Produtividade", value: "5-30 ciclos/min" }, { label: "Tipo de Máquina", value: "Semiautomática" }], images: [], youtubeUrl: "",
  },
  {
    id: "env-040", name: "SYF2 100 - ENVASADORA SEMI-AUT. P/ LIQUIDOS 10-100ML", category: "Envasadoras", model: "SYF2 100", next: "PAMQLQAU089", price: "Sob consulta", stockStatus: "in_stock", tags: [],
    specifications: [{ label: "Tipo de Produto", value: "Líquido" }, { label: "Volume Min", value: "10 ml" }, { label: "Volume Max", value: "100 ml" }, { label: "Produtividade", value: "5-30 ciclos/min (por bico)" }, { label: "Tipo de Máquina", value: "Semiautomática" }], images: [], youtubeUrl: "",
  },
  {
    id: "env-041", name: "SYF2 300 - ENVASADORA SEMI-AUT. P/ LIQUIDOS 30-300ML", category: "Envasadoras", model: "SYF2 300", next: "PAMQLQAU018", price: "Sob consulta", stockStatus: "in_stock", tags: [],
    specifications: [{ label: "Tipo de Produto", value: "Líquido" }, { label: "Volume Min", value: "30 ml" }, { label: "Volume Max", value: "300 ml" }, { label: "Produtividade", value: "5-30 ciclos/min (por bico)" }, { label: "Tipo de Máquina", value: "Semiautomática" }], images: [], youtubeUrl: "",
  },
  {
    id: "env-042", name: "SYF2 500 - ENVASADORA SEMI-AUT. P/ LIQUIDOS 50-500ML", category: "Envasadoras", model: "SYF2 500", next: "PAMQLQAU021", price: "Sob consulta", stockStatus: "in_stock", tags: [],
    specifications: [{ label: "Tipo de Produto", value: "Líquido" }, { label: "Volume Min", value: "50 ml" }, { label: "Volume Max", value: "500 ml" }, { label: "Produtividade", value: "5-30 ciclos/min (por bico)" }, { label: "Tipo de Máquina", value: "Semiautomática" }], images: [], youtubeUrl: "",
  },
  {
    id: "env-043", name: "SYF2 1000 - ENVASADORA SEMI-AUT. P/ LIQUIDOS 100-1000ML", category: "Envasadoras", model: "SYF2 1000", next: "PAMQLQAU020", price: "Sob consulta", stockStatus: "in_stock", tags: [],
    specifications: [{ label: "Tipo de Produto", value: "Líquido" }, { label: "Volume Min", value: "100 ml" }, { label: "Volume Max", value: "1000 ml" }, { label: "Produtividade", value: "5-30 ciclos/min (por bico)" }, { label: "Tipo de Máquina", value: "Semiautomática" }], images: [], youtubeUrl: "",
  },
  {
    id: "env-044", name: "SYF2 2500 - ENVASADORA SEMI-AUT. P/ LIQUIDOS 300-2500ML", category: "Envasadoras", model: "SYF2 2500", next: "PAMQLQAU030", price: "Sob consulta", stockStatus: "in_stock", tags: [],
    specifications: [{ label: "Tipo de Produto", value: "Líquido" }, { label: "Volume Min", value: "300 ml" }, { label: "Volume Max", value: "2500 ml" }, { label: "Produtividade", value: "5-30 ciclos/min (por bico)" }, { label: "Tipo de Máquina", value: "Semiautomática" }], images: [], youtubeUrl: "",
  },
  {
    id: "env-045", name: "A2 - ENVASADORA PNEUMATICA SEMI AUTOMATICA", category: "Envasadoras", model: "A2", next: "PAMQLQAU107", price: "Sob consulta", stockStatus: "in_stock", tags: [],
    specifications: [{ label: "Tipo de Produto", value: "Pastoso" }, { label: "Volume Min", value: "5 ml" }, { label: "Volume Max", value: "50 ml" }, { label: "Produtividade", value: "1500 ml/min" }, { label: "Tipo de Máquina", value: "Semiautomática" }], images: [], youtubeUrl: "",
  },
  {
    id: "env-046", name: "ALF1000-4B - ENVASADORA AUTOM. 4 BICOS P/ LIQ. 100/1000ML", category: "Envasadoras", model: "ALF1000-4B", next: "PAMQLQAU059", price: "Sob consulta", stockStatus: "in_stock", tags: ["Automático"],
    specifications: [{ label: "Tipo de Produto", value: "Líquido" }, { label: "Volume Min", value: "100 ml" }, { label: "Volume Max", value: "1000 ml" }, { label: "Produtividade", value: "16-20 ciclos/min (por bico)" }, { label: "Tipo de Máquina", value: "Automática" }], images: [], youtubeUrl: "",
  },
  {
    id: "env-047", name: "ALF1000-2B - ENVASADORA AUTOM. 2 BICOS P/ LIQ. 100/1000ML", category: "Envasadoras", model: "ALF1000-2B", next: "PAMQLQAU065", price: "Sob consulta", stockStatus: "in_stock", tags: ["Automático"],
    specifications: [{ label: "Tipo de Produto", value: "Líquido" }, { label: "Volume Min", value: "100 ml" }, { label: "Volume Max", value: "1000 ml" }, { label: "Produtividade", value: "16-20 ciclos/min (por bico)" }, { label: "Tipo de Máquina", value: "Automática" }], images: [], youtubeUrl: "",
  },
  {
    id: "env-048", name: "ALF500-4B - ENVASADORA AUTOM. 4 BICOS P/ LIQ. 50/500ML", category: "Envasadoras", model: "ALF500-4B", next: "PAMQLQAU058", price: "Sob consulta", stockStatus: "in_stock", tags: ["Automático"],
    specifications: [{ label: "Tipo de Produto", value: "Líquido" }, { label: "Volume Min", value: "50 ml" }, { label: "Volume Max", value: "500 ml" }, { label: "Produtividade", value: "16-20 ciclos/min (por bico)" }, { label: "Tipo de Máquina", value: "Automática" }], images: [], youtubeUrl: "",
  },
  {
    id: "env-049", name: "ALF500-2B - ENVASADORA AUTOM. 2 BICOS P/ LIQ. 50/500ML", category: "Envasadoras", model: "ALF500-2B", next: "PAMQLQAU064", price: "Sob consulta", stockStatus: "in_stock", tags: ["Automático"],
    specifications: [{ label: "Tipo de Produto", value: "Líquido" }, { label: "Volume Min", value: "50 ml" }, { label: "Volume Max", value: "500 ml" }, { label: "Produtividade", value: "16-20 ciclos/min (por bico)" }, { label: "Tipo de Máquina", value: "Automática" }], images: [], youtubeUrl: "",
  },
  {
    id: "env-050", name: "DGF/H 300 - ENVASADORA SEMI-AUT. P/ LIQ. E PAST. C/ MIXER HORIZ.", category: "Envasadoras", model: "DGF/H 300", next: "PAMQLQAU118", price: "Sob consulta", stockStatus: "in_stock", tags: [],
    specifications: [{ label: "Tipo de Produto", value: "Líquido/Pastoso" }, { label: "Volume Min", value: "30 ml" }, { label: "Volume Max", value: "300 ml" }, { label: "Produtividade", value: "5-30 ciclos/min" }, { label: "Tipo de Máquina", value: "Semiautomática" }], images: [], youtubeUrl: "",
  },
  {
    id: "env-051", name: "APF10000 - ENVASADORA DE BANCADA C/ BOMBA DE ROTOR", category: "Envasadoras", model: "APF10000", next: "PAMQLQAU110", price: "Sob consulta", stockStatus: "in_stock", tags: [],
    specifications: [{ label: "Tipo de Produto", value: "Líquido/Pastoso" }, { label: "Volume Min", value: "100 ml" }, { label: "Volume Max", value: "10000 ml" }, { label: "Produtividade", value: "250 ml/s" }, { label: "Tipo de Máquina", value: "Semiautomática" }], images: [], youtubeUrl: "",
  },
  {
    id: "env-052", name: "TLF600 - ENVASADORA DE 4 BICOS AUTOMATICA DE BANCADA", category: "Envasadoras", model: "TLF600", next: "PAMQLQAU111", price: "Sob consulta", stockStatus: "in_stock", tags: ["Automático"],
    specifications: [{ label: "Tipo de Produto", value: "Líquido" }, { label: "Volume Min", value: "50 ml" }, { label: "Volume Max", value: "500 ml" }, { label: "Produtividade", value: "15-25 frascos/min" }, { label: "Tipo de Máquina", value: "Automática" }], images: [], youtubeUrl: "",
  },
  {
    id: "env-053", name: "TLF600II - ENVASADORA DE 4 BICOS AUTOMATICA DE BANCADA", category: "Envasadoras", model: "TLF600II", next: "PAMQLQAU167", price: "Sob consulta", stockStatus: "in_stock", tags: ["Automático"],
    specifications: [{ label: "Tipo de Produto", value: "Líquido" }, { label: "Volume Min", value: "5 ml" }, { label: "Volume Max", value: "4500 ml" }, { label: "Produtividade", value: "20-40 frascos/min" }, { label: "Tipo de Máquina", value: "Automática" }], images: [], youtubeUrl: "",
  },
  {
    id: "env-054", name: "DGF/H 1000 - ENVASADORA SEMI-AUT. P/ LIQ. E PAST. C/ MIXER HORIZ.", category: "Envasadoras", model: "DGF/H 1000", next: "PAMQLQAU117", price: "Sob consulta", stockStatus: "in_stock", tags: [],
    specifications: [{ label: "Volume Min", value: "100 ml" }, { label: "Volume Max", value: "1000 ml" }, { label: "Produtividade", value: "5-30 ciclos/min" }], images: [], youtubeUrl: "",
  },
  {
    id: "env-055", name: "DGF/H 2500 - ENVASADORA SEMI-AUT. P/ LIQ. E PAST. C/ MIXER HORIZ.", category: "Envasadoras", model: "DGF/H 2500", next: "PAMQLQAU119", price: "Sob consulta", stockStatus: "in_stock", tags: [],
    specifications: [{ label: "Volume Min", value: "500 ml" }, { label: "Volume Max", value: "2500 ml" }, { label: "Produtividade", value: "5-30 ciclos/min" }], images: [], youtubeUrl: "",
  },

  // ========== SELADORAS DE CAIXA (Fechadoras) ==========
  {
    id: "fc-001", name: "AS323 - SELADORA SUPERIOR DE ABAS", category: "Seladoras de Caixa", model: "AS323", next: "PAMQCCSA026", price: "Sob consulta", stockStatus: "in_stock", tags: [],
    specifications: [{ label: "Tipo de Produto", value: "Caixa de Papelão" }, { label: "Local de Selagem", value: "Superior" }, { label: "Tam. Caixa (C)", value: "200-600 mm" }, { label: "Produtividade", value: "16 m/min" }, { label: "Tipo de Máquina", value: "Semiautomática" }], images: [], youtubeUrl: "",
  },
  {
    id: "fc-002", name: "AS723 - SELADORA AUTOMATICA P/FECH/ EM 4 LADOS", category: "Seladoras de Caixa", model: "AS723", next: "PAMQCCSA023", price: "Sob consulta", stockStatus: "in_stock", tags: ["Automático"],
    specifications: [{ label: "Tipo de Produto", value: "Caixa de Papelão" }, { label: "Local de Selagem", value: "4 Cantos" }, { label: "Tam. Caixa (C)", value: "320-500 mm" }, { label: "Produtividade", value: "6-10 caixas/min" }, { label: "Tipo de Máquina", value: "Automática" }], images: [], youtubeUrl: "",
  },
  {
    id: "fc-003", name: "AS823A - SELAD. PNEUMAT S-AUTOM DE CX. DE PAPELAO", category: "Seladoras de Caixa", model: "AS823A", next: "PAMQCCSA020", price: "Sob consulta", stockStatus: "in_stock", tags: [],
    specifications: [{ label: "Tipo de Produto", value: "Caixa de Papelão" }, { label: "Local de Selagem", value: "Super/Infer" }, { label: "Tam. Caixa (C)", value: "200 mm ou mais" }, { label: "Produtividade", value: "16 m/min" }, { label: "Tipo de Máquina", value: "Semiautomática" }], images: [], youtubeUrl: "",
  },
  {
    id: "fc-004", name: "AS823B - SELADORA PNEUMAT S-AUTOM DE CX. C/ TRAVA", category: "Seladoras de Caixa", model: "AS823B", next: "PAMQCCSA032", price: "Sob consulta", stockStatus: "in_stock", tags: [],
    specifications: [{ label: "Tipo de Produto", value: "Caixa de Papelão" }, { label: "Local de Selagem", value: "Super/Infer" }, { label: "Tam. Caixa (C)", value: "200 mm ou mais" }, { label: "Produtividade", value: "20 caixas/min" }, { label: "Tipo de Máquina", value: "Semiautomática" }], images: [], youtubeUrl: "",
  },
  {
    id: "fc-005", name: "FX-AT5050B - SELADORA AUTOMATICA DE CAIXAS DE PAPELAO", category: "Seladoras de Caixa", model: "FX-AT5050B", next: "PAMQCCSA022", price: "Sob consulta", stockStatus: "in_stock", tags: ["Automático"],
    specifications: [{ label: "Tipo de Produto", value: "Caixa de Papelão" }, { label: "Local de Selagem", value: "Super/Infer" }, { label: "Tam. Caixa (C)", value: "200-600 mm" }, { label: "Produtividade", value: "16 m/min" }, { label: "Tipo de Máquina", value: "Automática" }], images: [], youtubeUrl: "",
  },
  {
    id: "fc-006", name: "FX-AT5050D/HS - ACO INOX SELADORA SEMI-AUTOMAT. CAIXAS", category: "Seladoras de Caixa", model: "FX-AT5050D/HS", next: "PAMQCCSA035", price: "Sob consulta", stockStatus: "in_stock", tags: [],
    specifications: [{ label: "Tipo de Produto", value: "Caixa de Papelão" }, { label: "Local de Selagem", value: "Super/Infer" }, { label: "Produtividade", value: "16 m/min" }, { label: "Tipo de Máquina", value: "Semiautomática" }], images: [], youtubeUrl: "",
  },
  {
    id: "fc-007", name: "FX-AT5050 - SELADORA SEMI-AUTOMAT. DE CAIXAS DE PAPELAO", category: "Seladoras de Caixa", model: "FX-AT5050", next: "PAMQCCSA006", price: "Sob consulta", stockStatus: "in_stock", tags: [],
    specifications: [{ label: "Tipo de Produto", value: "Caixa de Papelão" }, { label: "Local de Selagem", value: "Super/Infer" }, { label: "Produtividade", value: "16 m/min" }, { label: "Tipo de Máquina", value: "Semiautomática" }], images: [], youtubeUrl: "",
  },
  {
    id: "fc-008", name: "FXJ4030 - SELADORA SEMI-AUTOMAT. DE CAIXAS DE PAPELAO", category: "Seladoras de Caixa", model: "FXJ4030", next: "PAMQCCSA030", price: "Sob consulta", stockStatus: "in_stock", tags: [],
    specifications: [{ label: "Tipo de Produto", value: "Caixa de Papelão" }, { label: "Local de Selagem", value: "Super/Infer" }, { label: "Tam. Caixa (C)", value: "90-300 mm" }, { label: "Produtividade", value: "20 m/min" }, { label: "Tipo de Máquina", value: "Semiautomática" }], images: [], youtubeUrl: "",
  },
  {
    id: "fc-009", name: "FXJ4030 - SELADORA SEMI-AUTOMAT. DE CAIXAS DE PAPELAO C/ PROTECAO", category: "Seladoras de Caixa", model: "FXJ4030", next: "PAMQCCSA048", price: "Sob consulta", stockStatus: "in_stock", tags: [],
    specifications: [{ label: "Tipo de Produto", value: "Caixa de Papelão" }, { label: "Local de Selagem", value: "Super/Infer" }, { label: "Tam. Caixa (C)", value: "90-300 mm" }, { label: "Produtividade", value: "20 m/min" }, { label: "Tipo de Máquina", value: "Semiautomática" }], images: [], youtubeUrl: "",
  },
  {
    id: "fc-010", name: "FXJ5050 - SELADORA SEMI-AUTOMAT. DE CAIXAS DE PAPELAO", category: "Seladoras de Caixa", model: "FXJ5050", next: "PAMQCCSA002", price: "Sob consulta", stockStatus: "in_stock", tags: [],
    specifications: [{ label: "Tipo de Produto", value: "Caixa de Papelão" }, { label: "Local de Selagem", value: "Super/Infer" }, { label: "Tam. Caixa (C)", value: "100-500 mm" }, { label: "Produtividade", value: "20 m/min" }, { label: "Tipo de Máquina", value: "Semiautomática" }], images: [], youtubeUrl: "",
  },
  {
    id: "fc-011", name: "FXJ5050 - SELADORA SEMI-AUTOMAT. DE CAIXAS DE PAPELAO C/ PROTECAO", category: "Seladoras de Caixa", model: "FXJ5050", next: "PAMQCCSA047", price: "Sob consulta", stockStatus: "in_stock", tags: [],
    specifications: [{ label: "Tipo de Produto", value: "Caixa de Papelão" }, { label: "Local de Selagem", value: "Super/Infer" }, { label: "Tam. Caixa (C)", value: "100-500 mm" }, { label: "Produtividade", value: "20 m/min" }, { label: "Tipo de Máquina", value: "Semiautomática" }], images: [], youtubeUrl: "",
  },
  {
    id: "fc-012", name: "FXJ5050S - SELADORA SEMI-AUTOMAT. DE CAIXAS (INOX)", category: "Seladoras de Caixa", model: "FXJ5050S", next: "PAMQCCSA013", price: "Sob consulta", stockStatus: "in_stock", tags: [],
    specifications: [{ label: "Tipo de Produto", value: "Caixa de Papelão" }, { label: "Local de Selagem", value: "Super/Infer" }, { label: "Tam. Caixa (C)", value: "100-500 mm" }, { label: "Produtividade", value: "20 m/min" }, { label: "Tipo de Máquina", value: "Semiautomática" }], images: [], youtubeUrl: "",
  },
  {
    id: "fc-013", name: "FXJ6050 - (CAB. 72MM) SELADORA SEMI AUT DE CAIXAS DE PAPELAO", category: "Seladoras de Caixa", model: "FXJ6050", next: "PAMQCCSA014", price: "Sob consulta", stockStatus: "in_stock", tags: [],
    specifications: [{ label: "Tipo de Produto", value: "Caixa de Papelão" }, { label: "Local de Selagem", value: "Super/Infer" }, { label: "Tam. Caixa (C)", value: "100 mm ou mais" }, { label: "Produtividade", value: "20 m/min" }, { label: "Tipo de Máquina", value: "Semiautomática" }], images: [], youtubeUrl: "",
  },
  {
    id: "fc-014", name: "FXJ6050/EC - SELADORA SEMI-AUTOMAT. DE CAIXAS DE PAPELAO", category: "Seladoras de Caixa", model: "FXJ6050/EC", next: "PAMQCCSA053", price: "Sob consulta", stockStatus: "in_stock", tags: [],
    specifications: [{ label: "Tipo de Produto", value: "Caixa de Papelão" }, { label: "Local de Selagem", value: "Super/Infer" }, { label: "Tam. Caixa (C)", value: "150 mm ou mais" }, { label: "Produtividade", value: "20 m/min" }, { label: "Tipo de Máquina", value: "Semiautomática" }], images: [], youtubeUrl: "",
  },
  {
    id: "fc-015", name: "FXJ6050 - SELADORA SEMI-AUTOMAT. DE CAIXAS DE PAPELAO", category: "Seladoras de Caixa", model: "FXJ6050", next: "PAMQCCSA001", price: "Sob consulta", stockStatus: "in_stock", tags: [],
    specifications: [{ label: "Tipo de Produto", value: "Caixa de Papelão" }, { label: "Local de Selagem", value: "Super/Infer" }, { label: "Tam. Caixa (C)", value: "100 mm ou mais" }, { label: "Produtividade", value: "20 m/min" }, { label: "Tipo de Máquina", value: "Semiautomática" }], images: [], youtubeUrl: "",
  },
  {
    id: "fc-016", name: "FXJ6050 - SELADORA SEMI-AUTOMAT. DE CAIXAS DE PAPELAO C/ PROTECOES", category: "Seladoras de Caixa", model: "FXJ6050", next: "PAMQCCSA046", price: "Sob consulta", stockStatus: "in_stock", tags: [],
    specifications: [{ label: "Tipo de Produto", value: "Caixa de Papelão" }, { label: "Local de Selagem", value: "Super/Infer" }, { label: "Tam. Caixa (C)", value: "100 mm ou mais" }, { label: "Produtividade", value: "20 m/min" }, { label: "Tipo de Máquina", value: "Semiautomática" }], images: [], youtubeUrl: "",
  },
  {
    id: "fc-017", name: "FXJ6060 - SELADORA SEMI-AUTOMAT. DE CAIXAS DE PAPELAO", category: "Seladoras de Caixa", model: "FXJ6060", next: "PAMQCCSA005", price: "Sob consulta", stockStatus: "in_stock", tags: [],
    specifications: [{ label: "Tipo de Produto", value: "Caixa de Papelão" }, { label: "Local de Selagem", value: "Super/Infer" }, { label: "Produtividade", value: "20 m/min" }, { label: "Tipo de Máquina", value: "Semiautomática" }], images: [], youtubeUrl: "",
  },
  {
    id: "fc-018", name: "FXJ9050T - SELADORA SEMI-AUTOMATICA DE CAIXAS DE PAP.", category: "Seladoras de Caixa", model: "FXJ9050T", next: "PAMQCCSA024", price: "Sob consulta", stockStatus: "in_stock", tags: [],
    specifications: [{ label: "Tipo de Produto", value: "Caixa de Papelão" }, { label: "Local de Selagem", value: "Super/Infer" }, { label: "Produtividade", value: "16 m/min" }, { label: "Tipo de Máquina", value: "Semiautomática" }], images: [], youtubeUrl: "",
  },
  {
    id: "fc-019", name: "SPG-6050 - SELADORA AUT. C/ FITA GOMADA P/ CAIXA PAPELAO", category: "Seladoras de Caixa", model: "SPG-6050", next: "PAMQCCSA033", price: "Sob consulta", stockStatus: "in_stock", tags: ["Automático"],
    specifications: [{ label: "Tipo de Produto", value: "Caixa de Papelão" }, { label: "Tipo de Fita", value: "Fita Gomada" }, { label: "Local de Selagem", value: "Super/Infer" }, { label: "Produtividade", value: "20 m/min" }, { label: "Tipo de Máquina", value: "Automática" }], images: [], youtubeUrl: "",
  },
];

const CatalogTab = ({ isAdmin }: CatalogTabProps) => {
  // --- STATE ---
  const [machines, setMachines] = useState<Machine[]>(() => {
    const saved = localStorage.getItem("catalog_machines_v23");
    if (saved) {
      try {
        const parsed: any[] = JSON.parse(saved);
        // Migration logic: ensure new fields exist
        return parsed.map(m => ({
          ...m,
          stockStatus: m.stockStatus || "in_stock",
          tags: m.tags || []
        }));
      } catch (e) {
        console.error("Failed to parse saved catalog", e);
        return initialMachines;
      }
    }
    return initialMachines;
  });

  const [globalTags, setGlobalTags] = useState<string[]>(() => {
    const saved = localStorage.getItem("catalog_tags_v4");
    return saved ? JSON.parse(saved) : INITIAL_TAGS;
  });

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Machine>>({});
  const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);

  // Two-phase navigation: null = show category grid, string = show machines for that category
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [tagFilter, setTagFilter] = useState<string>("all");

  // Manage Tags Dialog
  const [isTagsDialogOpen, setIsTagsDialogOpen] = useState(false);

  // --- PERSISTENCE ---
  useEffect(() => {
    try {
      localStorage.setItem("catalog_machines_v22", JSON.stringify(machines));
    } catch (e) {
      console.error("Storage limit", e);
      alert("Erro de armazenamento: limite excedido.");
    }
  }, [machines]);

  useEffect(() => {
    try {
      localStorage.setItem("catalog_tags_v4", JSON.stringify(globalTags));
    } catch (e) {
      console.error("Tags storage error", e);
    }
  }, [globalTags]);

  // --- COMPUTED ---
  const categories = useMemo(() => {
    const cats = [...new Set(machines.map((m) => m.category))];
    return cats.sort();
  }, [machines]);

  const filteredMachines = useMemo(() => {
    return machines.filter((machine) => {
      const searchLower = searchQuery.toLowerCase();

      const matchesSearch =
        searchQuery === "" ||
        machine.name.toLowerCase().includes(searchLower) ||
        machine.model.toLowerCase().includes(searchLower) ||
        machine.category.toLowerCase().includes(searchLower) ||
        (machine.price && machine.price.toLowerCase().includes(searchLower)) ||
        (machine.next && machine.next.toLowerCase().includes(searchLower)) ||
        // Check Stock Status Label
        STOCK_OPTIONS[machine.stockStatus || "in_stock"].label.toLowerCase().includes(searchLower) ||
        // Check Tags
        machine.tags.some(tag => tag.toLowerCase().includes(searchLower)) ||
        // Check Specifications
        machine.specifications.some(spec =>
          spec.label.toLowerCase().includes(searchLower) ||
          spec.value.toLowerCase().includes(searchLower)
        );

      const matchesCategory =
        categoryFilter === "all" || machine.category === categoryFilter;

      const matchesTag =
        tagFilter === "all" || machine.tags.includes(tagFilter);

      return matchesSearch && matchesCategory && matchesTag;
    });
  }, [machines, searchQuery, categoryFilter, tagFilter]);

  // --- HANDLERS ---

  // Category selection
  const handleSelectCategory = (categoryName: string) => {
    setSelectedCategory(categoryName);
    setCategoryFilter(categoryName);
    setSearchQuery("");
    setTagFilter("all");
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setCategoryFilter("all");
    setSearchQuery("");
    setTagFilter("all");
    setExpandedId(null);
    setEditingId(null);
    setEditData({});
  };

  // Image Utilities
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", 0.7));
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedBase64 = await compressImage(file);
        setEditData((prev) => {
          const newImages = [...(prev.images || [])];
          newImages[index] = compressedBase64;
          return { ...prev, images: newImages };
        });
      } catch (error) {
        console.error("Error", error);
        alert("Erro ao processar imagem.");
      }
    }
  };

  // Editing Handlers
  const handleAddMachine = () => {
    const newId = Date.now().toString();
    const newMachine: Machine = {
      id: newId,
      name: "Nova Máquina",
      category: selectedCategory || "Geral",
      model: "Modelo Novo",
      price: "R$ 0,00",
      images: [],
      specifications: [
        { label: "Especificação 1", value: "Valor 1" }
      ],
      tags: [],
      stockStatus: "in_stock",
      next: "",
      youtubeUrl: ""
    };

    setMachines([newMachine, ...machines]);
    setEditingId(newId);
    setEditData(newMachine);
    setExpandedId(newId);
  };

  const handleDeleteMachine = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeleteConfirmationId(id);
  };

  const confirmDelete = async () => {
    if (deleteConfirmationId) {
      try {
        // Try to delete from backend
        // await fetch(`/api/catalog/${deleteConfirmationId}`, {
        //   method: 'DELETE'
        // });
        // console.log('[Catalog] Deleted item from database');
      } catch (error) {
        console.error('[Catalog] Error deleting from database:', error);
        // Continue anyway to delete from local state
      }

      setMachines(prev => prev.filter(m => m.id !== deleteConfirmationId));
      if (expandedId === deleteConfirmationId) setExpandedId(null);
      if (editingId === deleteConfirmationId) setEditingId(null);
      setDeleteConfirmationId(null);
    }
  };

  const handleEdit = (machine: Machine) => {
    setEditingId(machine.id);
    setEditData(JSON.parse(JSON.stringify(machine)));
  };

  const handleSave = async () => {
    if (!editingId || !editData) return;

    try {
      // Find the existing machine to check if it's new or existing
      const existingMachine = machines.find(m => m.id === editingId);

      // Prepare catalog item data for backend
      const catalogItemData = {
        id: editingId,
        code: editData.model || existingMachine?.model || `CODE-${editingId}`,
        name: editData.name || existingMachine?.name || 'Nova Máquina',
        category: editData.category || existingMachine?.category || 'Geral',
        description: `${editData.model || ''} - ${editData.price || ''}`
      };

      // Update local state
      setMachines((prev) =>
        prev.map((m) => {
          if (m.id === editingId) {
            return {
              ...m,
              ...editData,
              specifications: editData.specifications || m.specifications,
              images: editData.images || m.images,
              tags: editData.tags || m.tags,
              stockStatus: editData.stockStatus || m.stockStatus,
              next: editData.next !== undefined ? editData.next : m.next
            } as Machine;
          }
          return m;
        })
      );

      setEditingId(null);
      setEditData({});
    } catch (error) {
      console.error('[Catalog] Error saving to database:', error);
      alert('Erro ao sincronizar com o banco de dados. A máquina foi salva localmente.');

      // Still update local state even if API fails
      setMachines((prev) =>
        prev.map((m) => {
          if (m.id === editingId) {
            return {
              ...m,
              ...editData,
              specifications: editData.specifications || m.specifications,
              images: editData.images || m.images,
              tags: editData.tags || m.tags,
              stockStatus: editData.stockStatus || m.stockStatus,
              next: editData.next !== undefined ? editData.next : m.next
            } as Machine;
          }
          return m;
        })
      );
      setEditingId(null);
      setEditData({});
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditData({});
  };

  // --- ASK ABOUT MACHINE (Chat integration) ---
  const handleAskAboutMachine = (machine: Machine) => {
    const message = `Me explique detalhadamente sobre a máquina "${machine.name}" (Modelo: ${machine.model}${machine.next ? `, Next: ${machine.next}` : ''}, Categoria: ${machine.category}). Quais são suas principais características, funcionalidades e aplicações?`;
    // Store pending message + mode preferences in sessionStorage — ChatTab picks up on mount
    sessionStorage.setItem('catalog_pending_question', message);
    sessionStorage.setItem('catalog_pending_chatmode', 'educational');
    sessionStorage.setItem('catalog_pending_functionmode', 'normal');
    window.dispatchEvent(new CustomEvent('switch-tab', { detail: 'chat' }));
  };

  // Machine Tag Management (in Edit Mode)
  const toggleMachineTag = (tag: string) => {
    setEditData(prev => {
      const currentTags = prev.tags || [];
      if (currentTags.includes(tag)) {
        return { ...prev, tags: currentTags.filter(t => t !== tag) };
      } else {
        return { ...prev, tags: [...currentTags, tag] };
      }
    });
  };

  // --- RENDER ---

  // Phase 1: Show category grid when no category is selected
  if (selectedCategory === null) {
    return (
      <CategoryGrid
        machines={machines}
        onSelectCategory={handleSelectCategory}
      />
    );
  }

  // Phase 2: Show machine list for selected category
  return (
    <div className="h-full overflow-y-auto scrollbar-thin p-4">
      <div className="w-full mx-auto space-y-4">

        {/* Back button */}
        <button
          onClick={handleBackToCategories}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao catálogo
        </button>

        <CatalogHeader
          isAdmin={isAdmin}
          totalMachines={machines.filter(m => m.category === selectedCategory).length}
          filteredCount={filteredMachines.length}
          onAddMachine={handleAddMachine}
          isTagsDialogOpen={isTagsDialogOpen}
          setIsTagsDialogOpen={setIsTagsDialogOpen}
          globalTags={globalTags}
          setGlobalTags={setGlobalTags}
        />

        <CatalogFilters
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          categoryFilter={categoryFilter}
          setCategoryFilter={setCategoryFilter}
          tagFilter={tagFilter}
          setTagFilter={setTagFilter}
          categories={categories}
          globalTags={globalTags}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredMachines.map((machine, index) => {
            const isExpanded = expandedId === machine.id;
            const isEditing = editingId === machine.id;

            return (
              <MachineCard
                key={`${machine.id}-${searchQuery}-${categoryFilter}-${tagFilter}`}
                machine={machine}
                index={index}
                isAdmin={isAdmin}
                isExpanded={isExpanded}
                isEditing={isEditing}
                editData={editData}
                globalTags={globalTags}
                setEditData={setEditData}
                onExpand={() => {
                  if (!isEditing) {
                    setExpandedId(isExpanded ? null : machine.id);
                  }
                }}
                onEdit={() => {
                  handleEdit(machine);
                  if (!isExpanded) setExpandedId(machine.id);
                }}
                onSave={handleSave}
                onCancel={handleCancel}
                onDelete={(e) => handleDeleteMachine(e, machine.id)}
                toggleMachineTag={toggleMachineTag}
                onAskAboutMachine={handleAskAboutMachine}
              >
                <MachineDetails
                  machine={machine}
                  isEditing={isEditing}
                  editData={editData}
                  setEditData={setEditData}
                  onImageUpload={handleImageUpload}
                />
              </MachineCard>
            );
          })}
        </div>

        {filteredMachines.length === 0 && (
          <div className="rounded-lg border border-border bg-card p-12 text-center">
            <p className="text-muted-foreground">Nenhuma máquina encontrada nesta categoria.</p>
          </div>
        )}

        <Dialog open={!!deleteConfirmationId} onOpenChange={(open) => !open && setDeleteConfirmationId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar Exclusão</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p>Tem certeza que deseja excluir esta máquina? Esta ação não pode ser desfeita.</p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteConfirmationId(null)}>Cancelar</Button>
              <Button variant="destructive" onClick={confirmDelete}>Excluir</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
};

export default CatalogTab;
