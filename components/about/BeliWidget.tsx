"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import {
  BELI_CATEGORY,
  BELI_PLACES,
  BELI_WANT_TO_TRY,
  beliScoreTone,
  formatBeliScore,
  type BeliTab,
} from "@/lib/beli";
import styles from "./BeliWidget.module.css";

const MINI_VISIBLE = 4;
const RECORDED_MS = 2200;

type RecommendPhase = "idle" | "compose" | "recorded";

function RecommendRow() {
  const [phase, setPhase] = useState<RecommendPhase>("idle");
  const [value, setValue] = useState("");
  const [recorded, setRecorded] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const fieldId = useId();

  useEffect(() => {
    if (phase !== "compose") return;
    inputRef.current?.focus();
  }, [phase]);

  useEffect(() => {
    if (phase !== "recorded") return;
    const timer = window.setTimeout(() => {
      setPhase("idle");
      setValue("");
      setRecorded("");
    }, RECORDED_MS);
    return () => window.clearTimeout(timer);
  }, [phase]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const next = value.trim();
    if (!next) return;
    setRecorded(next);
    setPhase("recorded");
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      event.stopPropagation();
      setPhase("idle");
      setValue("");
    }
  };

  if (phase === "recorded") {
    return (
      <li className={`${styles.row} ${styles.recommendRow}`} aria-live="polite">
        <div className={`${styles.rowMain} ${styles.recommendPop}`}>
          <p className={styles.name}>{recorded}</p>
          <p className={styles.meta}>Recommendation recorded</p>
        </div>
        <span className={`${styles.score} ${styles.high} ${styles.checkPop}`}>
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <path
              d="M3.2 8.4 6.3 11.4 12.8 4.6"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </li>
    );
  }

  if (phase === "compose") {
    return (
      <li className={`${styles.row} ${styles.recommendRow}`}>
        <form className={styles.recommendForm} onSubmit={submit}>
          <label className={styles.recommendLabel} htmlFor={fieldId}>
            Recommend a spot
          </label>
          <div className={styles.recommendField}>
            <input
              id={fieldId}
              ref={inputRef}
              className={styles.recommendInput}
              value={value}
              onChange={(event) => setValue(event.target.value)}
              onKeyDown={onKeyDown}
              placeholder="A cafe, drink, or shop"
              autoComplete="off"
              maxLength={80}
            />
            <button
              type="submit"
              className={styles.recommendSend}
              disabled={!value.trim()}
            >
              Add
            </button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className={`${styles.row} ${styles.recommendRow}`}>
      <button
        type="button"
        className={styles.recommendButton}
        onClick={() => setPhase("compose")}
      >
        Give Recommendations
        <span className={styles.recommendPlus} aria-hidden="true">
          +
        </span>
      </button>
    </li>
  );
}

export default function BeliWidget({ mini = false }: { mini?: boolean }) {
  const [tab, setTab] = useState<BeliTab>("been");
  const active = mini ? "been" : tab;
  const want = BELI_WANT_TO_TRY;
  const been = mini ? BELI_PLACES.slice(0, MINI_VISIBLE) : BELI_PLACES;

  return (
    <aside
      className={`${styles.phone} ${mini ? styles.mini : ""}`}
      aria-label={mini ? undefined : `${BELI_CATEGORY} ranking`}
    >
      <header className={styles.chrome}>
        <p className={styles.listsLabel}>{"Ethan's Beli List."}</p>
        <p className={styles.category}>{BELI_CATEGORY}</p>
        <div className={styles.tabs} role={mini ? undefined : "tablist"}>
          <button
            type="button"
            className={active === "been" ? styles.tabActive : styles.tab}
            role={mini ? undefined : "tab"}
            aria-selected={mini ? undefined : active === "been"}
            tabIndex={mini ? -1 : undefined}
            onClick={mini ? undefined : () => setTab("been")}
          >
            Been
          </button>
          <button
            type="button"
            className={active === "want" ? styles.tabActive : styles.tab}
            role={mini ? undefined : "tab"}
            aria-selected={mini ? undefined : active === "want"}
            tabIndex={mini ? -1 : undefined}
            onClick={mini ? undefined : () => setTab("want")}
          >
            Want to Try
          </button>
        </div>
      </header>

      <ol
        key={active}
        className={styles.list}
        data-lenis-prevent={mini ? undefined : ""}
        data-lenis-prevent-touch={mini ? undefined : ""}
        tabIndex={mini ? undefined : 0}
      >
        {active === "been"
          ? been.map((place) => (
              <li key={place.rank} className={styles.row}>
                <div className={styles.rowMain}>
                  <p className={styles.name}>
                    <span className={styles.rank}>{place.rank}.</span>{" "}
                    {place.name}
                  </p>
                  <p className={styles.meta}>
                    {place.price} <span className={styles.metaSep}>|</span>{" "}
                    {place.tags}
                  </p>
                  {place.location ? (
                    <p className={styles.location}>{place.location}</p>
                  ) : null}
                </div>
                <span
                  className={`${styles.score} ${styles[beliScoreTone(place.score)]}`}
                  aria-label={`Score ${formatBeliScore(place.score)}`}
                >
                  {formatBeliScore(place.score)}
                </span>
              </li>
            ))
          : (
              <>
                <RecommendRow />
                {want.map((place) => (
                  <li key={place.name} className={styles.row}>
                    <div className={styles.rowMain}>
                      <p className={styles.name}>{place.name}</p>
                      <p className={styles.meta}>
                        {place.price}
                        {place.tags ? (
                          <>
                            {" "}
                            <span className={styles.metaSep}>|</span>{" "}
                            {place.tags}
                          </>
                        ) : null}
                      </p>
                      {place.location ? (
                        <p className={styles.location}>{place.location}</p>
                      ) : null}
                    </div>
                  </li>
                ))}
              </>
            )}
      </ol>
    </aside>
  );
}
