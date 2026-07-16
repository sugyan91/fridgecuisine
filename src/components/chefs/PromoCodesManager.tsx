import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  listMyPromoCodes,
  upsertPromoCode,
  deletePromoCode,
  type PromoCode,
} from "@/lib/promo-codes.functions";

export function PromoCodesManager() {
  const listFn = useServerFn(listMyPromoCodes);
  const upsertFn = useServerFn(upsertPromoCode);
  const deleteFn = useServerFn(deletePromoCode);

  const [rows, setRows] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);

  const [code, setCode] = useState("");
  const [type, setType] = useState<"percent" | "amount">("percent");
  const [value, setValue] = useState("10");
  const [maxUses, setMaxUses] = useState("");
  const [expires, setExpires] = useState("");

  const reload = async () => {
    setLoading(true);
    try { setRows(await listFn()); } finally { setLoading(false); }
  };
  useEffect(() => { reload(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const submit = async () => {
    if (!code.trim()) return toast.error("Enter a code");
    const val = Number(value);
    if (!Number.isFinite(val) || val <= 0) return toast.error("Value must be positive");
    if (type === "percent" && (val < 1 || val > 100)) return toast.error("Percent must be 1-100");
    setSaving(true);
    try {
      const res = await upsertFn({
        data: {
          code: code.trim(),
          discount_type: type,
          discount_value: type === "percent" ? val : Math.round(val * 100), // amount input in dollars → cents
          max_uses: maxUses ? Number(maxUses) : undefined,
          active: true,
          expires_at: expires ? new Date(expires).toISOString() : undefined,
        },
      });
      if ("error" in res) { toast.error(res.error); return; }
      toast.success("Promo code created");
      setCode(""); setValue("10"); setMaxUses(""); setExpires(""); setCreating(false);
      await reload();
    } finally { setSaving(false); }
  };

  const toggleActive = async (row: PromoCode) => {
    const res = await upsertFn({ data: {
      id: row.id, code: row.code, discount_type: row.discount_type,
      discount_value: row.discount_value, active: !row.active,
      max_uses: row.max_uses ?? undefined,
      expires_at: row.expires_at ?? undefined,
    } });
    if ("error" in res) toast.error(res.error);
    else await reload();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this promo code?")) return;
    const res = await deleteFn({ data: { id } });
    if ("error" in res) toast.error(res.error);
    else { toast.success("Deleted"); await reload(); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-muted-foreground">
          Chef-scoped codes buyers can enter at checkout for your paid recipes. Discounts apply on top of your list price.
        </p>
        {!creating && (
          <Button size="sm" onClick={() => setCreating(true)} className="ml-2">
            <Plus className="h-4 w-4 mr-1" /> New code
          </Button>
        )}
      </div>

      {creating && (
        <div className="rounded-xl border-2 border-border bg-background p-4 mb-4 space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <Label className="text-xs">Code</Label>
              <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="SPRING25" />
            </div>
            <div>
              <Label className="text-xs">Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as "percent" | "amount")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="percent">Percent %</SelectItem>
                  <SelectItem value="amount">Amount $</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">{type === "percent" ? "Percent off" : "Dollars off"}</Label>
              <Input value={value} onChange={(e) => setValue(e.target.value)} inputMode="decimal" />
            </div>
            <div>
              <Label className="text-xs">Max uses (optional)</Label>
              <Input value={maxUses} onChange={(e) => setMaxUses(e.target.value)} inputMode="numeric" placeholder="∞" />
            </div>
          </div>
          <div>
            <Label className="text-xs">Expires (optional)</Label>
            <Input type="datetime-local" value={expires} onChange={(e) => setExpires(e.target.value)} />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => setCreating(false)}>Cancel</Button>
            <Button size="sm" disabled={saving} onClick={submit}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create code"}
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" /></div>
      ) : rows.length === 0 ? (
        <div className="text-center text-sm text-muted-foreground py-6 border-2 border-dashed border-border rounded-xl">
          <Tag className="h-5 w-5 inline mr-1" /> No promo codes yet.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border-2 border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Code</th>
                <th className="px-3 py-2">Discount</th>
                <th className="px-3 py-2">Uses</th>
                <th className="px-3 py-2">Expires</th>
                <th className="px-3 py-2">Active</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="px-3 py-2 font-mono font-bold">{r.code}</td>
                  <td className="px-3 py-2">
                    {r.discount_type === "percent"
                      ? `${r.discount_value}%`
                      : `$${(r.discount_value / 100).toFixed(2)}`}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {r.uses_count}{r.max_uses ? ` / ${r.max_uses}` : ""}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {r.expires_at ? new Date(r.expires_at).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-3 py-2"><Switch checked={r.active} onCheckedChange={() => toggleActive(r)} /></td>
                  <td className="px-3 py-2 text-right">
                    <Button variant="ghost" size="sm" onClick={() => remove(r.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}