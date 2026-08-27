"use client";

import { Fragment } from "react";

const URL_RE = /https?:\/\/[^\s<>"')\]]+/g;

function renderWithLinks(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  URL_RE.lastIndex = 0;
  while ((match = URL_RE.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(
        <Fragment key={`t-${lastIndex}`}>
          {text.slice(lastIndex, match.index)}
        </Fragment>
      );
    }
    const url = match[0];
    parts.push(
      <a
        key={`a-${match.index}`}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
      >
        {url}
      </a>
    );
    lastIndex = match.index + url.length;
  }
  if (lastIndex < text.length) {
    parts.push(
      <Fragment key={`t-${lastIndex}`}>{text.slice(lastIndex)}</Fragment>
    );
  }
  return parts;
}

export function LinkifyText({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <>
      {lines.map((line, i) => (
        <Fragment key={i}>
          {i > 0 && "\n"}
          {line ? renderWithLinks(line) : ""}
        </Fragment>
      ))}
    </>
  );
}
