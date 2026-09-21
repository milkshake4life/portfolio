"use client";

import { useState } from "react";
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

export default function BeliWidget({ mini = false }: { mini?: boolean }) {
  const [tab, setTab] = useState<BeliTab>("been");
  const active = mini ? "been" : tab;
  const want = BELI_WANT_TO_TRY;
  const been = mini ? BELI_PLACES.slice(0, MINI_VISIBLE) : BELI_PLACES;
  const places = active === "been" ? been : want;

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

      {places.length === 0 ? (
        <p className={styles.empty}>No places on this list yet.</p>
      ) : (
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
            : want.map((place) => (
                <li key={place.name} className={styles.row}>
                  <div className={styles.rowMain}>
                    <p className={styles.name}>{place.name}</p>
                    <p className={styles.meta}>
                      {place.price}
                      {place.tags ? (
                        <>
                          {" "}
                          <span className={styles.metaSep}>|</span> {place.tags}
                        </>
                      ) : null}
                    </p>
                    {place.location ? (
                      <p className={styles.location}>{place.location}</p>
                    ) : null}
                  </div>
                </li>
              ))}
        </ol>
      )}
    </aside>
  );
}
