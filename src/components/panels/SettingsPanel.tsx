// src/components/panels/SettingsPanel.tsx
import React from "react";
import { Palette, Eye, Sparkles, Smartphone, ShieldAlert, Check } from "lucide-react";
import { Sheet, Card, SectionTitle } from "../Sheet";
import { usePlayer } from "../../context/PlayerContext";
import { ThemeId, Settings } from "../../types/sudoku";

interface SettingsPanelProps {
  onClose: () => void;
  maxMistakes: number | null;
  onChangeMaxMistakes: (value: number | null) => void;
}

const THEMES: { id: ThemeId; name: string; bg: string; accent: string; dark: boolean }[] = [
  { id: "midnight", name: "Полночь", bg: "#09090b", accent: "#818cf8", dark: true },
  { id: "ocean", name: "Океан", bg: "#040d1a", accent: "#22d3ee", dark: true },
  { id: "forest", name: "Лес", bg: "#07110c", accent: "#34d399", dark: true },
  { id: "sunset", name: "Закат", bg: "#140a0c", accent: "#fb923c", dark: true },
  { id: "paper", name: "Бумага", bg: "#f5f3ee", accent: "#4f46e5", dark: false },
  { id: "sakura", name: "Сакура", bg: "#fdf2f6", accent: "#db2777", dark: false },
];

const Toggle: React.FC<{
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}> = ({ label, description, checked, onChange }) => (
  <label className="flex items-center justify-between p-3.5 rounded-xl hover:bg-fg/5 cursor-pointer transition select-none">
    <div className="pr-4">
      <div className="text-sm font-semibold text-fg">{label}</div>
      {description && <div className="text-xs text-muted mt-0.5">{description}</div>}
    </div>
    <div
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out ${
        checked ? "bg-accent" : "bg-surface-2 border border-line/60"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
          checked ? "translate-x-5" : "translate-x-0.5"
        } mt-0.5`}
      />
    </div>
  </label>
);

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ onClose, maxMistakes, onChangeMaxMistakes }) => {
  const { player, updateSettings } = usePlayer();
  const settings = player.settings;

  const setSetting = <K extends keyof Settings>(key: K, val: Settings[K]) => {
    updateSettings({ [key]: val });
  };

  return (
    <Sheet title="Настройки" onClose={onClose}>
      {/* Theme selection */}
      <div>
        <SectionTitle>
          <span className="flex items-center gap-1.5">
            <Palette size={14} /> Тема оформления
          </span>
        </SectionTitle>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {THEMES.map(t => {
            const isSelected = settings.theme === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setSetting("theme", t.id)}
                className={`p-3 rounded-2xl border text-left transition relative flex flex-col justify-between gap-3 ${
                  isSelected
                    ? "border-accent ring-2 ring-accent/30 shadow-lg shadow-accent/10"
                    : "border-line/50 hover:border-line"
                }`}
                style={{ backgroundColor: t.bg }}
              >
                <div className="flex items-center justify-between w-full">
                  <span
                    className="text-xs font-bold"
                    style={{ color: t.dark ? "#ffffff" : "#18181b" }}
                  >
                    {t.name}
                  </span>
                  {isSelected && (
                    <span
                      className="w-5 h-5 rounded-full flex items-center justify-center text-white"
                      style={{ backgroundColor: t.accent }}
                    >
                      <Check size={12} strokeWidth={3} />
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: t.accent }} />
                  <span
                    className="text-[10px] font-mono opacity-60"
                    style={{ color: t.dark ? "#ffffff" : "#18181b" }}
                  >
                    {t.dark ? "тёмная" : "светлая"}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Mistake Limit */}
      <div>
        <SectionTitle>
          <span className="flex items-center gap-1.5">
            <ShieldAlert size={14} /> Лимит ошибок
          </span>
        </SectionTitle>
        <Card className="p-1.5 grid grid-cols-4 gap-1">
          {[
            { val: 3, label: "3" },
            { val: 5, label: "5" },
            { val: 10, label: "10" },
            { val: null, label: "∞ Дзен" },
          ].map(opt => {
            const isSelected = maxMistakes === opt.val;
            return (
              <button
                key={String(opt.val)}
                onClick={() => onChangeMaxMistakes(opt.val)}
                className={`py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isSelected
                    ? "bg-accent text-accent-fg shadow"
                    : "text-muted hover:text-fg hover:bg-fg/5"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </Card>
      </div>

      {/* Visual aids */}
      <div>
        <SectionTitle>
          <span className="flex items-center gap-1.5">
            <Eye size={14} /> Подсветка и визуальные подсказки
          </span>
        </SectionTitle>
        <Card className="p-0 divide-y divide-line/40 overflow-hidden">
          <Toggle
            label="Подсветка строки, столбца и блока"
            description="Подсвечивает зону текущей выбранной ячейки"
            checked={settings.highlightRegion}
            onChange={v => setSetting("highlightRegion", v)}
          />
          <Toggle
            label="Подсветка одинаковых цифр"
            description="Выделяет все клетки и заметки с такой же цифрой"
            checked={settings.highlightSameNumbers}
            onChange={v => setSetting("highlightSameNumbers", v)}
          />
          <Toggle
            label="Подсветка конфликтов"
            description="Показывает ячейки, конфликтующие с ошибочной"
            checked={settings.highlightConflicts}
            onChange={v => setSetting("highlightConflicts", v)}
          />
        </Card>
      </div>

      {/* Automation & feel */}
      <div>
        <SectionTitle>
          <span className="flex items-center gap-1.5">
            <Sparkles size={14} /> Игровой процесс
          </span>
        </SectionTitle>
        <Card className="p-0 divide-y divide-line/40 overflow-hidden">
          <Toggle
            label="Автоочистка заметок"
            description="Удаляет цифру из заметок в строке, столбце и блоке при верном ходе"
            checked={settings.autoRemoveNotes}
            onChange={v => setSetting("autoRemoveNotes", v)}
          />
          <Toggle
            label="Отображение таймера"
            description="Показывать текущее время партии в верхней панели"
            checked={settings.showTimer}
            onChange={v => setSetting("showTimer", v)}
          />
          <Toggle
            label="Вибрация"
            description="Тактильный отклик при нажатии и ошибках (для смартфонов)"
            checked={settings.vibration}
            onChange={v => setSetting("vibration", v)}
          />
        </Card>
      </div>

      {/* About */}
      <div className="text-center text-xs text-muted py-2 space-y-1">
        <div>Премиум Судоку v2.0</div>
        <div>Все данные сохраняются локально и синхронизируются через Firebase</div>
      </div>
    </Sheet>
  );
};
