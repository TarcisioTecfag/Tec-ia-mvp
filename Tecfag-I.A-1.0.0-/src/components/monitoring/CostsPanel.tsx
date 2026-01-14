import { useState, useEffect } from "react";
import { monitoringApi, CostsData, TokenCostSettings } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Coins, TrendingUp, Users, Save, Loader2 } from "lucide-react";

const CostsPanel = () => {
    const [costsData, setCostsData] = useState<CostsData | null>(null);
    const [costSettings, setCostSettings] = useState<TokenCostSettings | null>(null);
    const [inputCost, setInputCost] = useState("");
    const [outputCost, setOutputCost] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [usage, settings] = await Promise.all([
                monitoringApi.getTokenUsage(),
                monitoringApi.getTokenCostSettings(),
            ]);
            setCostsData(usage);
            setCostSettings(settings);
            setInputCost(settings.inputCostPer1M.toString());
            setOutputCost(settings.outputCostPer1M.toString());
        } catch (error) {
            console.error("Error loading costs data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveSettings = async () => {
        try {
            setSaving(true);
            setSaveMessage(null);

            const settings = await monitoringApi.updateTokenCostSettings({
                inputCostPer1M: parseFloat(inputCost) || 0,
                outputCostPer1M: parseFloat(outputCost) || 0,
            });

            setCostSettings(settings);
            setSaveMessage({ type: 'success', text: 'Configurações salvas com sucesso!' });

            // Reload usage data with new costs
            const usage = await monitoringApi.getTokenUsage();
            setCostsData(usage);

            // Clear message after 3 seconds
            setTimeout(() => setSaveMessage(null), 3000);
        } catch (error) {
            console.error("Error saving settings:", error);
            setSaveMessage({ type: 'error', text: 'Erro ao salvar configurações' });
        } finally {
            setSaving(false);
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: costsData?.currency || 'BRL',
        }).format(value);
    };

    const formatNumber = (value: number) => {
        return new Intl.NumberFormat('pt-BR').format(value);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-primary/20 bg-primary/5">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Coins className="w-5 h-5 text-primary" />
                            Custo Total
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-primary">
                            {formatCurrency(costsData?.totalCost || 0)}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                            Gasto total estimado
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-blue-500/20 bg-blue-500/5">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-blue-500" />
                            Tokens Totais
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-blue-500">
                            {formatNumber(costsData?.totalTokens || 0)}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                            Input: {formatNumber(costsData?.totalInputTokens || 0)} | Output: {formatNumber(costsData?.totalOutputTokens || 0)}
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-green-500/20 bg-green-500/5">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Users className="w-5 h-5 text-green-500" />
                            Usuários Ativos
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-green-500">
                            {costsData?.usageByUser.length || 0}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                            Usuários com consumo
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-orange-500/20 bg-orange-500/5">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Coins className="w-5 h-5 text-orange-500" />
                            Custo Médio
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-orange-500">
                            {formatCurrency(
                                costsData?.usageByUser.length
                                    ? (costsData.totalCost / costsData.usageByUser.length)
                                    : 0
                            )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                            Por usuário
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Cost Settings */}
            <Card>
                <CardHeader>
                    <CardTitle>Configuração de Custos</CardTitle>
                    <CardDescription>
                        Defina o custo por milhão de tokens para calcular os gastos
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="inputCost">Custo por 1M Tokens de Entrada (R$)</Label>
                            <Input
                                id="inputCost"
                                type="number"
                                step="0.01"
                                min="0"
                                value={inputCost}
                                onChange={(e) => setInputCost(e.target.value)}
                                placeholder="Ex: 1.25"
                            />
                            <p className="text-xs text-muted-foreground">
                                Tokens usados no prompt/contexto
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="outputCost">Custo por 1M Tokens de Saída (R$)</Label>
                            <Input
                                id="outputCost"
                                type="number"
                                step="0.01"
                                min="0"
                                value={outputCost}
                                onChange={(e) => setOutputCost(e.target.value)}
                                placeholder="Ex: 5.00"
                            />
                            <p className="text-xs text-muted-foreground">
                                Tokens gerados na resposta
                            </p>
                        </div>
                    </div>
                    <div className="mt-4 flex items-center gap-4">
                        <Button onClick={handleSaveSettings} disabled={saving}>
                            {saving ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <Save className="w-4 h-4 mr-2" />
                            )}
                            Salvar Configurações
                        </Button>
                        {saveMessage && (
                            <span className={`text-sm ${saveMessage.type === 'success' ? 'text-green-500' : 'text-red-500'}`}>
                                {saveMessage.text}
                            </span>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Usage by User Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Consumo por Usuário</CardTitle>
                    <CardDescription>
                        Detalhamento do uso de tokens e custo por usuário
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {!costsData?.usageByUser.length ? (
                        <p className="text-center text-muted-foreground py-8">
                            Nenhum consumo de tokens registrado ainda. Use o Chat I.A para gerar dados.
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {costsData.usageByUser.map((user) => {
                                const percentage = costsData.totalCost > 0
                                    ? (user.totalCost / costsData.totalCost) * 100
                                    : 0;

                                return (
                                    <div
                                        key={user.userId}
                                        className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                <Users className="w-5 h-5 text-primary" />
                                            </div>
                                            <div>
                                                <p className="font-medium">{user.userName}</p>
                                                <p className="text-xs text-muted-foreground">{user.userEmail}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="text-right">
                                                <p className="text-sm text-muted-foreground">
                                                    {formatNumber(user.totalTokens)} tokens
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    In: {formatNumber(user.totalInputTokens)} | Out: {formatNumber(user.totalOutputTokens)}
                                                </p>
                                            </div>
                                            <div className="text-right min-w-[100px]">
                                                <p className="text-lg font-bold text-primary">
                                                    {formatCurrency(user.totalCost)}
                                                </p>
                                            </div>
                                            <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-primary rounded-full transition-all"
                                                    style={{ width: `${Math.min(percentage, 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default CostsPanel;
