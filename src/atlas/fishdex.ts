import { FISH_SPECIES, type FishSpecies } from '../game/data/fish';
import { loadSave } from '../game/save';

type FishNameEntry = {
  id: string;
  display_name_th: string;
  scientific_name: string;
  common_name_en: string | null;
  verified_aliases_th: string[];
  reported_aliases_th_pending_review: string[];
  searchable_names_th: string[];
  priority: boolean;
  popular: boolean;
  interest_tags: string[];
  name_evidence_status: string;
  evidence_urls: string[];
  origin_status: string;
  possible_synonym_review_with: string | null;
  gameplay_ready: false;
  review_note: string | null;
};
type NameDirectory = {
  research_only: true;
  counts: { records: number; gameplay_ready: number };
  notice_th: string;
  entries: FishNameEntry[];
};
type Tab = 'thailand' | 'playable';
type Hooks = { onOpen(): void; onClose(): void };
type Entry = { id: string; name: string; scientific: string; en: string | null; playable: boolean; popular: boolean };
const normalize = (input: string): string => input.trim().normalize('NFKC').toLocaleLowerCase();
const sortThai = (a: Entry, b: Entry): number =>
  Number(b.popular) - Number(a.popular) ||
  a.name.localeCompare(b.name, 'th') || a.scientific.localeCompare(b.scientific, 'en');

const lookup = <T extends HTMLElement>(id: string): T => {
  const value = document.getElementById(id);
  if (!value) throw new Error('Missing Fishdex component #' + id);
  return value as T;
};

export function mountFishdex(hooks: Hooks): void {
  const modal = lookup<HTMLElement>('fishdex-modal');
  const openDesktop = lookup<HTMLButtonElement>('fishdex-open');
  const openMobile = lookup<HTMLButtonElement>('fishdex-open-mobile');
  const closeButton = lookup<HTMLButtonElement>('fishdex-close');
  const search = lookup<HTMLInputElement>('fishdex-search');
  const list = lookup<HTMLElement>('fishdex-list');
  const detail = lookup<HTMLElement>('fishdex-detail');
  const count = lookup<HTMLElement>('fishdex-count');
  const more = lookup<HTMLButtonElement>('fishdex-more');
  const notice = lookup<HTMLElement>('fishdex-notice');
  const tabs = Array.from(modal.querySelectorAll<HTMLButtonElement>('[data-fishdex-tab]'));
  const researchTab = tabs.find(x => x.dataset.fishdexTab === 'thailand');
  const playableTab = tabs.find(x => x.dataset.fishdexTab === 'playable');
  if (!researchTab || !playableTab) throw new Error('Fishdex tabs are missing');

  const playable: Entry[] = FISH_SPECIES.map(s => ({
    id: s.id, name: s.nameTh, scientific: s.scientific,
    en: s.nameEn, popular: true, playable: true
  })).sort(sortThai);
  let directory: NameDirectory | null = null;
  let fetchInProgress: Promise<void> | null = null;
  let tab: Tab = 'thailand';
  let selectedId: string | null = null;
  let shown = 40;
  let opener: HTMLElement | null = null;

  const addLine = (container: HTMLElement, className: string, value: string): HTMLElement => {
    const paragraph = document.createElement('p');
    paragraph.className = className;
    paragraph.textContent = value;
    container.appendChild(paragraph);
    return paragraph;
  };
  const current = (): Entry[] => tab === 'playable' ? playable :
    (directory?.entries ?? []).map(r => ({
      id: r.id, name: r.display_name_th, scientific: r.scientific_name,
      en: r.common_name_en, playable: false, popular: r.popular
    })).sort(sortThai);
  const activeMatches = (): Entry[] => {
    const keyword = normalize(search.value);
    if (!keyword) return current();
    return current().filter(row => {
      const alternate = tab === 'thailand' ?
        directory?.entries.find(x => x.id === row.id) : null;
      const lookupValues = [
        row.name, row.scientific, row.en ?? '',
        ...(alternate?.searchable_names_th ?? [])
      ];
      return lookupValues.some(value => normalize(value).includes(keyword));
    });
  };

  const renderDetail = (row?: Entry): void => {
    detail.replaceChildren();
    if (!row) {
      addLine(detail, 'fishdex-placeholder', 'เลือกปลาเพื่อดูชื่อวิทยาศาสตร์และข้อมูลที่มา');
      return;
    }
    const h3 = document.createElement('h3');
    h3.textContent = row.name;
    detail.append(h3);
    const latin = document.createElement('em');
    latin.className = 'fishdex-latin';
    latin.textContent = row.scientific;
    detail.append(latin);
    if (row.en) addLine(detail, 'fishdex-english', 'English: ' + row.en);
    if (row.playable) {
      const species: FishSpecies | undefined = FISH_SPECIES.find(x => x.id === row.id);
      if (!species) return;
      const illustration = document.createElement('img');
      illustration.src = import.meta.env.BASE_URL + 'assets/fish/' + species.id + '.svg';
      illustration.alt = 'ภาพประกอบปลา ' + row.name;
      illustration.loading = 'lazy';
      illustration.className = 'fishdex-fish-image';
      detail.append(illustration);
      const save = loadSave();
      const record = save.records[species.id];
      addLine(detail, 'fishdex-status', save.discovered.includes(species.id) ?
        'พบปลาในเกมแล้ว ✓' : 'ยังไม่พบปลาในเกม');
      if (record) addLine(detail, 'fishdex-record',
        'จับได้ ' + record.catches + ' ครั้ง · สถิติยาวสุด ' + record.bestLengthCm.toFixed(1) + ' ซม.');
      addLine(detail, 'fishdex-label', 'ถิ่นอาศัยในเกม (ข้อมูลต้นแบบ)');
      addLine(detail, 'fishdex-body', species.habitatNote);
      addLine(detail, 'fishdex-body', species.distributionNote);
      addLine(detail, 'fishdex-small-note',
        'ข้อมูลนี้มาจาก Fishing Lab และยังต้องทบทวนรายละเอียดทางชีววิทยาก่อนเผยแพร่เชิงวิชาการ');
      return;
    }
    const research = directory?.entries.find(x => x.id === row.id);
    if (!research) return;
    addLine(detail, 'fishdex-status fishdex-pending', 'รายการวิจัย — ยังไม่ใช่ปลาที่จับได้ในเกม');
    if (research.verified_aliases_th.length)
      addLine(detail, 'fishdex-alias', 'ชื่อเรียกอื่น: ' + research.verified_aliases_th.join(', '));
    if (research.reported_aliases_th_pending_review.length)
      addLine(detail, 'fishdex-alias', 'ชื่อจากทะเบียนที่รอตรวจ: ' +
        research.reported_aliases_th_pending_review.join(', '));
    if (research.possible_synonym_review_with)
      addLine(detail, 'fishdex-small-note', 'ชื่อวิทยาศาสตร์ที่สงสัยว่าเป็นชื่อพ้อง (รอตรวจ): ' +
        research.possible_synonym_review_with);
    if (research.origin_status.includes('introduced')) {
      addLine(detail, 'fishdex-small-note', 'ชนิดนำเข้าหรือแพร่เข้ามา — อยู่ระหว่างยืนยันสถานะพื้นที่');
    }
    if (research.review_note)
      addLine(detail, 'fishdex-small-note', research.review_note);
    addLine(detail, 'fishdex-small-note', research.name_evidence_status === 'name_pair_crosschecked_in_research' ?
      'คู่ชื่อไทยและชื่อวิทยาศาสตร์ผ่านการเทียบเอกสารระดับวิจัย (ยังไม่อนุมัติข้อมูลเกม)' :
      'ชื่อจากเอกสารอ้างอิง ยังต้องตรวจความถูกต้องกับอนุกรมวิธานปัจจุบัน');
    addLine(detail, 'fishdex-label', 'แหล่งอ้างอิงเพื่อศึกษาต่อ');
    const links = document.createElement('div');
    links.className = 'fishdex-links';
    for (const [index, href] of research.evidence_urls.entries()) {
      if (!href.startsWith('https://')) continue;
      const a = document.createElement('a');
      a.href = href;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      const publisher = new URL(href).hostname.includes('fisheries.go.th') ? 'กรมประมง' : 'TH-BIF (สผ.)';
      a.textContent = publisher + ' — แหล่งที่ ' + (index + 1) + ' ↗';
      links.append(a);
    }
    detail.append(links);
  };

  const renderList = (): void => {
    const results = activeMatches();
    if (selectedId && !results.some(row => row.id === selectedId)) selectedId = null;
    if (!selectedId) selectedId = results[0]?.id ?? null;
    count.textContent = 'พบ ' + results.length + ' รายการ' +
      (tab === 'thailand' ? ' (ข้อมูลวิจัย ไม่ใช่ปลาที่เกิดในเกม)' : ' (ปลาในฉากปัจจุบัน)');
    list.replaceChildren();
    for (const row of results.slice(0, shown)) {
      const wrapper = document.createElement('div');
      wrapper.setAttribute('role', 'listitem');
      const button = document.createElement('button');
      button.className = 'fishdex-item';
      button.type = 'button';
      button.dataset.id = row.id;
      button.setAttribute('aria-pressed', String(row.id === selectedId));
      const main = document.createElement('strong');
      main.textContent = row.name;
      const sub = document.createElement('small');
      sub.textContent = row.scientific;
      button.append(main, sub);
      if (row.popular && tab === 'thailand') {
        const popular = document.createElement('span');
        popular.className = 'fishdex-popular';
        popular.textContent = 'คนรู้จัก';
        button.append(popular);
      }
      button.addEventListener('click', () => {
        selectedId = row.id;
        for (const choice of list.querySelectorAll<HTMLButtonElement>('.fishdex-item')) {
          choice.setAttribute('aria-pressed', String(choice.dataset.id === selectedId));
        }
        renderDetail(row);
      });
      wrapper.append(button);
      list.append(wrapper);
    }
    more.hidden = results.length <= shown;
    renderDetail(results.find(row => row.id === selectedId));
  };

  const loadResearch = async (): Promise<void> => {
    if (directory) return;
    if (fetchInProgress) return fetchInProgress;
    fetchInProgress = (async () => {
      notice.textContent = 'กำลังเปิดทะเบียนปลาไทย…';
      const response = await fetch(import.meta.env.BASE_URL + 'data/fish-atlas/thailand-name-index.json');
      if (!response.ok) throw new Error('Fishdex HTTP ' + response.status);
      const result = await response.json() as NameDirectory;
      if (!result.research_only || result.counts.gameplay_ready !== 0 ||
          !Array.isArray(result.entries) || result.entries.length < 200) {
        throw new Error('Fishdex candidate-index contract mismatch');
      }
      directory = result;
      notice.textContent = result.notice_th;
    })();
    try { await fetchInProgress; }
    finally { fetchInProgress = null; }
  };
  const setTab = async (next: Tab): Promise<void> => {
    tab = next;
    selectedId = null;
    shown = 40;
    search.value = '';
    for (const button of tabs)
      button.setAttribute('aria-pressed', String(button.dataset.fishdexTab === next));
    if (next === 'thailand') {
      try { await loadResearch(); }
      catch {
        notice.textContent = 'ไม่สามารถโหลดทะเบียนปลาไทยได้ กรุณาลองใหม่';
      }
    } else {
      notice.textContent = 'ปลาในเกมใช้ชื่อไทยเป็นหลัก และเก็บชื่อวิทยาศาสตร์เพื่อการเรียนรู้';
    }
    renderList();
  };

  async function open(source: HTMLElement): Promise<void> {
    if (!modal.hidden) return;
    opener = source;
    modal.hidden = false;
    hooks.onOpen();
    search.focus();
    await setTab('thailand');
  }
  function close(): void {
    if (modal.hidden) return;
    modal.hidden = true;
    hooks.onClose();
    opener?.focus();
  }
  openDesktop.addEventListener('click', () => { void open(openDesktop); });
  openMobile.addEventListener('click', () => { void open(openMobile); });
  closeButton.addEventListener('click', close);
  modal.addEventListener('click', event => { if (event.target === modal) close(); });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !modal.hidden) { event.preventDefault(); close(); }
    if (event.key === 'Tab' && !modal.hidden) {
      const focusable = Array.from(modal.querySelectorAll<HTMLElement>(
        'button:not([disabled]):not([hidden]), input:not([disabled]), a[href]'
      )).filter(x => x.getClientRects().length);
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        last.focus(); event.preventDefault();
      } else if (!event.shiftKey && document.activeElement === last) {
        first.focus(); event.preventDefault();
      }
    }
  });
  for (const button of tabs) button.addEventListener('click', () => {
    void setTab(button.dataset.fishdexTab as Tab);
  });
  search.addEventListener('input', () => { selectedId = null; shown = 40; renderList(); });
  more.addEventListener('click', () => { shown += 40; renderList(); });
}
