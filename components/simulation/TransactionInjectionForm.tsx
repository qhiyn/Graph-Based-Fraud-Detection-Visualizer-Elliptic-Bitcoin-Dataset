"use client";

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Crosshair, Trash2 } from "lucide-react";

export interface InjectionFormValues {
  label: string;
  timeStep: number | null;
  amountGrowthFactor: number;
  degreeGrowthFactor: number;
}

interface Props {
  values: InjectionFormValues;
  onChange: (v: InjectionFormValues) => void;
  timeSteps: number[];
  running: boolean;
  canRun: boolean;
  hasResult: boolean;
  onRun: () => void;
  onClear: () => void;
  onFocus: () => void;
}

export function TransactionInjectionForm({ values, onChange, timeSteps, running, canRun, hasResult, onRun, onClear, onFocus }: Props) {
  const set = (patch: Partial<InjectionFormValues>) => onChange({ ...values, ...patch });
  const num = (v: number | readonly number[]) => (Array.isArray(v) ? v[0] : (v as number));

  return (
    <div className="space-y-2.5">
      <div>
        <p className="font-medium text-foreground mb-1">Label</p>
        <input
          value={values.label}
          onChange={(e) => set({ label: e.target.value })}
          placeholder="Simulated transaction"
          className="w-full h-8 rounded-md border border-input bg-transparent px-2 text-xs"
        />
      </div>

      <div>
        <p className="font-medium text-foreground mb-1">Time step</p>
        <Select value={values.timeStep == null ? "none" : String(values.timeStep)} onValueChange={(v) => set({ timeStep: v === "none" ? null : Number(v) })}>
          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Time step…" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none" className="text-xs">Unspecified</SelectItem>
            {timeSteps.map((t) => <SelectItem key={t} value={String(t)} className="text-xs">Step {t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div>
        <div className="flex justify-between mb-1"><p className="font-medium text-foreground">Amount growth</p><span className="text-muted-foreground">{Math.round(values.amountGrowthFactor * 100)}%</span></div>
        <Slider min={0} max={1} step={0.05} value={[values.amountGrowthFactor]} onValueChange={(v) => set({ amountGrowthFactor: num(v) })} />
      </div>

      <div>
        <div className="flex justify-between mb-1"><p className="font-medium text-foreground">Degree growth</p><span className="text-muted-foreground">{Math.round(values.degreeGrowthFactor * 100)}%</span></div>
        <Slider min={0} max={1} step={0.05} value={[values.degreeGrowthFactor]} onValueChange={(v) => set({ degreeGrowthFactor: num(v) })} />
      </div>

      <Button size="sm" className="w-full text-xs" onClick={onRun} disabled={running || !canRun}>
        {running ? <Loader2 className="h-3 w-3 animate-spin" /> : "Run simulation"}
      </Button>
      {hasResult && (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={onFocus}>
            <Crosshair className="h-3 w-3 mr-1" /> Focus
          </Button>
          <Button size="sm" variant="ghost" className="flex-1 text-xs" onClick={onClear}>
            <Trash2 className="h-3 w-3 mr-1" /> Clear
          </Button>
        </div>
      )}
    </div>
  );
}
