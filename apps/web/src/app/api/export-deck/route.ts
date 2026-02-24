import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import crypto from "crypto";

export const runtime = "nodejs";

const FIELD_SEPARATOR = "\x1f";

interface SqlJs {
  Database: new () => {
    run(sql: string, params?: unknown[]): void;
    export(): Uint8Array;
    close(): void;
  };
}

function generateAnkiDb(
  sql: SqlJs,
  deckName: string,
  cards: { front: string; back: string; tags: string[] }[],
): Uint8Array {
  const db = new sql.Database();
  const now = Math.floor(Date.now() / 1000);
  const deckId = now * 1000 + 1;
  const modelId = now * 1000 + 2;

  db.run(`
    CREATE TABLE col (
      id integer PRIMARY KEY, crt integer NOT NULL, mod integer NOT NULL,
      scm integer NOT NULL, ver integer NOT NULL, dty integer NOT NULL,
      usn integer NOT NULL, ls integer NOT NULL, conf text NOT NULL,
      models text NOT NULL, decks text NOT NULL, dconf text NOT NULL, tags text NOT NULL
    );
    CREATE TABLE notes (
      id integer PRIMARY KEY, guid text NOT NULL, mid integer NOT NULL,
      mod integer NOT NULL, usn integer NOT NULL, tags text NOT NULL,
      flds text NOT NULL, sfld integer NOT NULL, csum integer NOT NULL,
      flags integer NOT NULL, data text NOT NULL
    );
    CREATE TABLE cards (
      id integer PRIMARY KEY, nid integer NOT NULL, did integer NOT NULL,
      ord integer NOT NULL, mod integer NOT NULL, usn integer NOT NULL,
      type integer NOT NULL, queue integer NOT NULL, due integer NOT NULL,
      ivl integer NOT NULL, factor integer NOT NULL, reps integer NOT NULL,
      lapses integer NOT NULL, left integer NOT NULL, odue integer NOT NULL,
      odid integer NOT NULL, flags integer NOT NULL, data text NOT NULL
    );
    CREATE TABLE revlog (
      id integer PRIMARY KEY, cid integer NOT NULL, usn integer NOT NULL,
      ease integer NOT NULL, ivl integer NOT NULL, lastIvl integer NOT NULL,
      factor integer NOT NULL, time integer NOT NULL, type integer NOT NULL
    );
    CREATE TABLE graves (usn integer NOT NULL, oid integer NOT NULL, type integer NOT NULL);
    CREATE INDEX ix_notes_usn ON notes (usn);
    CREATE INDEX ix_notes_csum ON notes (csum);
    CREATE INDEX ix_cards_nid ON cards (nid);
    CREATE INDEX ix_cards_sched ON cards (did, queue, due);
    CREATE INDEX ix_cards_usn ON cards (usn);
    CREATE INDEX ix_revlog_cid ON revlog (cid);
    CREATE INDEX ix_revlog_usn ON revlog (usn);
  `);

  const models = {
    [modelId]: {
      id: modelId, name: "Basic", type: 0, mod: now, usn: -1, sortf: 0,
      did: deckId,
      tmpls: [{
        name: "Card 1", ord: 0,
        qfmt: "{{Front}}",
        afmt: '{{FrontSide}}<hr id=answer>{{Back}}',
        bqfmt: "", bafmt: "", did: null,
      }],
      flds: [
        { name: "Front", ord: 0, sticky: false, rtl: false, font: "Arial", size: 20, media: [] },
        { name: "Back", ord: 1, sticky: false, rtl: false, font: "Arial", size: 20, media: [] },
      ],
      css: ".card { font-family: arial; font-size: 20px; text-align: center; color: black; background-color: white; }",
      latexPre: "", latexPost: "",
      req: [[0, "all", [0]]], tags: [], vers: [],
    },
  };

  const decks = {
    "1": {
      id: 1, name: "Default", conf: 1, extendNew: 10, extendRev: 50,
      desc: "", dyn: 0, usn: -1, lrnToday: [0, 0], revToday: [0, 0],
      newToday: [0, 0], timeToday: [0, 0], collapsed: false, mod: now,
    },
    [deckId]: {
      id: deckId, name: deckName, conf: 1, extendNew: 10, extendRev: 50,
      desc: "", dyn: 0, usn: -1, lrnToday: [0, 0], revToday: [0, 0],
      newToday: [0, 0], timeToday: [0, 0], collapsed: false, mod: now,
    },
  };

  const dconf = {
    "1": {
      id: 1, name: "Default", mod: 0, usn: 0, maxTaken: 60, autoplay: true,
      timer: 0, replayq: true, dyn: false,
      new: { delays: [1, 10], ints: [1, 4, 7], initialFactor: 2500, order: 1, perDay: 20, bury: true },
      rev: { perDay: 100, ease4: 1.3, fuzz: 0.05, minSpace: 1, ivlFct: 1, maxIvl: 36500, bury: true },
      lapse: { delays: [10], mult: 0, minInt: 1, leechFails: 8, leechAction: 0 },
    },
  };

  const conf = {
    nextPos: 1, estTimes: true, activeDecks: [1], sortType: "noteFld",
    timeLim: 0, sortBackwards: false, addToCur: true, curDeck: 1,
    newBury: true, newSpread: 0, dueCounts: true, curModel: String(modelId),
    collapseTime: 1200,
  };

  db.run(
    `INSERT INTO col VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [1, now, now * 1000, now * 1000, 11, 0, -1, 0,
      JSON.stringify(conf), JSON.stringify(models),
      JSON.stringify(decks), JSON.stringify(dconf), "{}"],
  );

  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];
    const noteId = deckId + i + 100;
    const cardId = deckId + i + 10000;
    const guid = crypto.randomBytes(5).toString("base64").slice(0, 10);
    const flds = card.front + FIELD_SEPARATOR + card.back;
    const csum = parseInt(
      crypto.createHash("sha1").update(card.front).digest("hex").slice(0, 8),
      16,
    );
    const tags = card.tags.length > 0 ? ` ${card.tags.join(" ")} ` : "";

    db.run(
      `INSERT INTO notes VALUES(?,?,?,?,?,?,?,?,?,?,?)`,
      [noteId, guid, modelId, now, -1, tags, flds, card.front, csum, 0, ""],
    );
    db.run(
      `INSERT INTO cards VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [cardId, noteId, deckId, 0, now, -1, 0, 0, i, 0, 0, 0, 0, 0, 0, 0, 0, ""],
    );
  }

  const data = db.export();
  db.close();
  return data;
}

export async function GET(req: NextRequest) {
  const deckId = req.nextUrl.searchParams.get("deckId");
  if (!deckId) {
    return NextResponse.json({ error: "deckId obrigatório" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new Response("Não autorizado", { status: 401 });
  }

  const [deckResult, flashcardsResult] = await Promise.all([
    supabase
      .from("decks")
      .select("title")
      .eq("id", deckId)
      .eq("user_id", user.id)
      .single(),
    supabase
      .from("flashcards")
      .select("front, back, extra_context, tags")
      .eq("deck_id", deckId)
      .order("created_at", { ascending: true }),
  ]);

  if (!deckResult.data) {
    return NextResponse.json({ error: "Deck não encontrado" }, { status: 404 });
  }

  const deck = deckResult.data;
  const flashcards = flashcardsResult.data ?? [];

  if (flashcards.length === 0) {
    return NextResponse.json(
      { error: "Deck sem flashcards para exportar" },
      { status: 400 },
    );
  }

  const ankiCards = flashcards.map((fc) => ({
    front: fc.front,
    back: fc.extra_context
      ? `${fc.back}<br><hr><small><i>${fc.extra_context}</i></small>`
      : fc.back,
    tags: Array.isArray(fc.tags) ? fc.tags as string[] : [],
  }));

  const initSqlJs = (await import("sql.js")).default;
  const sql = await initSqlJs();

  const dbData = generateAnkiDb(sql as unknown as SqlJs, deck.title, ankiCards);

  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();
  zip.file("collection.anki2", dbData);
  zip.file("media", "{}");

  const zipArrayBuffer = await zip.generateAsync({ type: "arraybuffer" });

  const safeName = deck.title
    .replace(/[^a-zA-Z0-9À-ÿ\s-]/g, "")
    .replace(/\s+/g, "_")
    .slice(0, 50);

  return new Response(zipArrayBuffer, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${safeName}.apkg"`,
      "Content-Length": String(zipArrayBuffer.byteLength),
    },
  });
}
