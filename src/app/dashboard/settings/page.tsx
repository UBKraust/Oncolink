import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Smartphone, Globe, UserCircle, KeyRound, CheckCircle2, Lock } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 pb-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Setări Cabinet</h1>
        <p className="text-sm text-muted-foreground mt-1">Gestionează profilul administrativ, tarifele, și integrările externe.</p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="mb-4 grid w-full grid-cols-3 md:w-[400px]">
          <TabsTrigger value="profile">Profil & Tarife</TabsTrigger>
          <TabsTrigger value="integrations">Integrări</TabsTrigger>
          <TabsTrigger value="security">Securitate</TabsTrigger>
        </TabsList>

        {/* PROFIL & TARIFE */}
        <TabsContent value="profile" className="space-y-4 animate-in fade-in duration-500">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCircle className="h-5 w-5 text-primary" />
                Date Identificare Terapeut
              </CardTitle>
              <CardDescription>Informațiile care vor apărea pe documentele emise (inclusiv facturi).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Nume Complet Titular</Label>
                  <Input id="full_name" defaultValue="Ioana Cosmina Terente" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cpr_code">Cod Parafă (CPR)</Label>
                  <Input id="cpr_code" defaultValue="123456" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cif">CIF / CUI Cabinet</Label>
                  <Input id="cif" defaultValue="42880000" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="iban">Cont IBAN</Label>
                  <Input id="iban" defaultValue="RO89INGB0000000000000000" />
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t pt-4">
              <Button>Salvează Modificările</Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Catalog Tarife</CardTitle>
              <CardDescription>Configurează diversele tipuri de ședințe și prețul lor implicit (RON).</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <Input defaultValue="Ședință Psihologie Individuală" className="flex-1" />
                  <div className="flex items-center gap-2 w-32">
                    <Input type="number" defaultValue="250" />
                    <span className="text-sm font-medium text-muted-foreground w-8">RON</span>
                  </div>
                  <Button variant="ghost" className="text-rose-600 hover:text-rose-700 hover:bg-rose-50">Șterge</Button>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <Input defaultValue="Consiliere Cuplu" className="flex-1" />
                  <div className="flex items-center gap-2 w-32">
                    <Input type="number" defaultValue="350" />
                    <span className="text-sm font-medium text-muted-foreground w-8">RON</span>
                  </div>
                  <Button variant="ghost" className="text-rose-600 hover:text-rose-700 hover:bg-rose-50">Șterge</Button>
                </div>
              </div>
              <Button variant="outline" className="mt-4">Adaugă Tarif Nou</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* INTEGRĂRI API */}
        <TabsContent value="integrations" className="space-y-4 animate-in fade-in duration-500">
          
          <Card>
            <CardHeader className="bg-muted/20 border-b pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-red-500" />
                    Google Workspace (Calendar & Drive)
                  </CardTitle>
                  <CardDescription className="mt-1">Acces pentru generare link-uri Meet și încărcare documente pe Drive.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <Button asChild variant="outline" className="w-full sm:w-auto">
                <a href="/api/google/auth">
                  Conectează Cont Google
                </a>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="bg-muted/20 border-b pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-blue-600" />
                    Facturare: SmartBill API
                  </CardTitle>
                  <CardDescription className="mt-1">Emitere automată de facturi și chitanțe pentru clienți.</CardDescription>
                </div>
                <div className="flex items-center gap-1.5 rounded-full border bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  <span className="h-2 w-2 rounded-full bg-emerald-500"></span> Conectat
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Email Cont SmartBill</Label>
                  <Input type="email" placeholder="email@exemplu.ro" defaultValue="cabinet@terente.ro" />
                </div>
                <div className="space-y-2">
                  <Label>Cod CIF Facturare</Label>
                  <Input defaultValue="42880000" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Token API (Secret)</Label>
                  <Input type="password" defaultValue="************************" />
                </div>
              </div>
              <Button variant="outline" className="w-full sm:w-auto">Testează Conexiunea</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="bg-muted/20 border-b pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Smartphone className="h-5 w-5 text-indigo-500" />
                    Notificări SMS: Twilio
                  </CardTitle>
                  <CardDescription className="mt-1">Folosit pentru trimiterea alertelor de programare pacienților.</CardDescription>
                </div>
                <div className="flex items-center gap-1.5 rounded-full border bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-500">
                  Neconfigurat
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Account SID</Label>
                  <Input placeholder="ACxxxxxxxxxxxxx" />
                </div>
                <div className="space-y-2">
                  <Label>Auth Token</Label>
                  <Input type="password" placeholder="•••••••••••••••••" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Număr Telefon Sender (Alocat pe Twilio)</Label>
                  <Input placeholder="+1234567890" />
                </div>
              </div>
              <Button>Conectează Cont</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SECURITATE */}
        <TabsContent value="security" className="space-y-4 animate-in fade-in duration-500">
          <Card className="border-amber-200 bg-amber-50/30 dark:border-amber-900/40 dark:bg-amber-950/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-500">
                <Shield className="h-5 w-5" />
                PIN Dosar Clinic (Acces Notițe)
              </CardTitle>
              <CardDescription className="text-amber-700/80 dark:text-amber-500/80">
                Notițele clinice atașate ședințelor conțin informații extrem de sensibile. Ele sunt blocate în baza de date
                și interfața cere acest cod PIN pentru a vizualiza sau edita documentele ("Lock Screen").
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-start gap-4 p-4 rounded-md bg-background border">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900 rounded-full shrink-0">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="font-medium text-sm">Sistem activat</p>
                  <p className="text-xs text-muted-foreground mt-1">Conținutul dosarelor este momentan protejat cu un cod de siguranță setat de tine.</p>
                </div>
              </div>

              <div className="space-y-4 border-t border-amber-200/50 pt-6">
                <h4 className="text-sm font-semibold flex gap-2 items-center"><KeyRound className="w-4 h-4" /> Schimbă codul PIN</h4>
                <div className="grid gap-4 max-w-sm">
                  <div className="space-y-2">
                    <Label>PIN Curent</Label>
                    <Input type="password" placeholder="••••" maxLength={4} className="font-mono text-center tracking-[0.5em]" />
                  </div>
                  <div className="space-y-2">
                    <Label>PIN Nou</Label>
                    <Input type="password" placeholder="••••" maxLength={4} className="font-mono text-center tracking-[0.5em]" />
                  </div>
                  <Button className="mt-2 w-full gap-2">
                    <Lock className="w-4 h-4" /> Actualizează Securitatea
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}
