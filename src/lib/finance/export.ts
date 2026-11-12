import { moneyInput } from "./money";
import type { Transaction } from "./model";

function csvCell(value: string, textual: boolean) {
  const safe = textual && /^[\s]*[=+\-@]|^[\t\r\n]/.test(value) ? "'" + value : value;
  return '"' + safe.replaceAll('"', '""') + '"';
}

export function transactionsCsv(
  transactions: Transaction[],
  labels: (entry: Transaction) => { name: string; account: string; destination: string },
) {
  const header = "date,type,name,category,account,destination,amount,note";
  const records = transactions.map((entry) => {
    const { name, account, destination } = labels(entry);
    return [
      csvCell(entry.date, false),
      csvCell(entry.kind, false),
      csvCell(name, true),
      csvCell(entry.kind === "transfer" ? "" : entry.category, false),
      csvCell(account, true),
      csvCell(destination, true),
      csvCell(moneyInput(entry.amount), false),
      csvCell(entry.note, true),
    ].join(",");
  });
  return "\uFEFF" + [header, ...records].join("\r\n");
}

export function downloadText(filename: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
