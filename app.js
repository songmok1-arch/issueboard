// 이슈보드 — Supabase 연동 공통 로직

const supabaseClient = window.supabase.createClient(
  window.SUPABASE_URL,
  window.SUPABASE_ANON_KEY
);

function genShareCode(len = 6) {
  const chars = "abcdefghijkmnpqrstuvwxyz23456789";
  let out = "";
  const arr = new Uint32Array(len);
  crypto.getRandomValues(arr);
  for (let i = 0; i < len; i++) out += chars[arr[i] % chars.length];
  return out;
}

async function createBoard(title) {
  const share_code = genShareCode();
  const { data, error } = await supabaseClient
    .from("ib_boards")
    .insert({ title, share_code })
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function loadBoardByCode(code) {
  const { data, error } = await supabaseClient
    .from("ib_boards")
    .select("*")
    .eq("share_code", code)
    .single();
  if (error) throw error;
  return data;
}

async function loadIssues(boardId) {
  const { data, error } = await supabaseClient
    .from("ib_issues")
    .select("*")
    .eq("board_id", boardId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

async function addIssue(boardId, { title, severity, owner, memo }) {
  const { data, error } = await supabaseClient
    .from("ib_issues")
    .insert({ board_id: boardId, title, severity: severity || "medium", owner: owner || null, memo: memo || null })
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function updateIssueStatus(id, status) {
  const { error } = await supabaseClient.from("ib_issues").update({ status }).eq("id", id);
  if (error) throw error;
}

async function deleteIssue(id) {
  const { error } = await supabaseClient.from("ib_issues").delete().eq("id", id);
  if (error) throw error;
}

function statusLabel(status) {
  return { open: "미해결", doing: "진행중", resolved: "해결됨" }[status] || status;
}
function nextStatus(status) {
  return { open: "doing", doing: "resolved", resolved: "open" }[status] || "open";
}
function severityLabel(sev) {
  return { low: "낮음", medium: "보통", high: "높음", critical: "긴급" }[sev] || sev;
}

function exportMarkdown(board, issues) {
  const lines = [`# ${board.title} — 이슈/리스크`, ""];
  issues.forEach((it) => {
    const owner = it.owner ? ` — 담당: ${it.owner}` : "";
    lines.push(`- [${severityLabel(it.severity)}] ${it.title}${owner} (${statusLabel(it.status)})`);
  });
  return lines.join("\n");
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (e) {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try {
      document.execCommand("copy");
      document.body.removeChild(ta);
      return true;
    } catch (e2) {
      document.body.removeChild(ta);
      return false;
    }
  }
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
