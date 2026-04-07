'use client';

import { type ComponentProps, type ReactNode } from 'react';

export function PlayIcon(props: ComponentProps<'svg'>): ReactNode {
  return <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" aria-hidden="true" viewBox="0 0 18 18" {...props}><path fill="currentColor" d="m14.051 10.723-7.985 4.964a1.98 1.98 0 0 1-2.758-.638A2.06 2.06 0 0 1 3 13.964V4.036C3 2.91 3.895 2 5 2c.377 0 .747.109 1.066.313l7.985 4.964a2.057 2.057 0 0 1 .627 2.808c-.16.257-.373.475-.627.637"/></svg>;
}

export function PauseIcon(props: ComponentProps<'svg'>): ReactNode {
  return <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" aria-hidden="true" viewBox="0 0 18 18" {...props}><rect width="5" height="14" x="2" y="2" fill="currentColor" rx="1.75"/><rect width="5" height="14" x="11" y="2" fill="currentColor" rx="1.75"/></svg>;
}

export function VolumeHighIcon(props: ComponentProps<'svg'>): ReactNode {
  return <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" aria-hidden="true" viewBox="0 0 18 18" {...props}><path fill="currentColor" d="M15.6 3.3c-.4-.4-1-.4-1.4 0s-.4 1 0 1.4C15.4 5.9 16 7.4 16 9s-.6 3.1-1.8 4.3c-.4.4-.4 1 0 1.4.2.2.5.3.7.3.3 0 .5-.1.7-.3C17.1 13.2 18 11.2 18 9s-.9-4.2-2.4-5.7"/><path fill="currentColor" d="M.714 6.008h3.072l4.071-3.857c.5-.376 1.143 0 1.143.601V15.28c0 .602-.643.903-1.143.602l-4.071-3.858H.714c-.428 0-.714-.3-.714-.752V6.76c0-.451.286-.752.714-.752m10.568.59a.91.91 0 0 1 0-1.316.91.91 0 0 1 1.316 0c1.203 1.203 1.47 2.216 1.522 3.208q.012.255.011.51c0 1.16-.358 2.733-1.533 3.803a.7.7 0 0 1-.298.156c-.382.106-.873-.011-1.018-.156a.91.91 0 0 1 0-1.316c.57-.57.995-1.551.995-2.487 0-.944-.26-1.667-.995-2.402"/></svg>;
}

export function VolumeLowIcon(props: ComponentProps<'svg'>): ReactNode {
  return <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" aria-hidden="true" viewBox="0 0 18 18" {...props}><path fill="currentColor" d="M.714 6.008h3.072l4.071-3.857c.5-.376 1.143 0 1.143.601V15.28c0 .602-.643.903-1.143.602l-4.071-3.858H.714c-.428 0-.714-.3-.714-.752V6.76c0-.451.286-.752.714-.752m10.568.59a.91.91 0 0 1 0-1.316.91.91 0 0 1 1.316 0c1.203 1.203 1.47 2.216 1.522 3.208q.012.255.011.51c0 1.16-.358 2.733-1.533 3.803a.7.7 0 0 1-.298.156c-.382.106-.873-.011-1.018-.156a.91.91 0 0 1 0-1.316c.57-.57.995-1.551.995-2.487 0-.944-.26-1.667-.995-2.402"/></svg>;
}

export function VolumeOffIcon(props: ComponentProps<'svg'>): ReactNode {
  return <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" aria-hidden="true" viewBox="0 0 18 18" {...props}><path fill="currentColor" d="M.714 6.008h3.072l4.071-3.857c.5-.376 1.143 0 1.143.601V15.28c0 .602-.643.903-1.143.602l-4.071-3.858H.714c-.428 0-.714-.3-.714-.752V6.76c0-.451.286-.752.714-.752M14.5 7.586l-1.768-1.768a1 1 0 1 0-1.414 1.414L13.085 9l-1.767 1.768a1 1 0 0 0 1.414 1.414l1.768-1.768 1.768 1.768a1 1 0 0 0 1.414-1.414L15.914 9l1.768-1.768a1 1 0 0 0-1.414-1.414z"/></svg>;
}

export function FullscreenEnterIcon(props: ComponentProps<'svg'>): ReactNode {
  return <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" aria-hidden="true" viewBox="0 0 18 18" {...props}><path fill="currentColor" d="M9.57 3.617A1 1 0 0 0 8.646 3H4c-.552 0-1 .449-1 1v4.646a.996.996 0 0 0 1.001 1 1 1 0 0 0 .706-.293l4.647-4.647a1 1 0 0 0 .216-1.089m4.812 4.812a1 1 0 0 0-1.089.217l-4.647 4.647a.998.998 0 0 0 .708 1.706H14c.552 0 1-.449 1-1V9.353a1 1 0 0 0-.618-.924"/></svg>;
}

export function FullscreenExitIcon(props: ComponentProps<'svg'>): ReactNode {
  return <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" aria-hidden="true" viewBox="0 0 18 18" {...props}><path fill="currentColor" d="M7.883 1.93a.99.99 0 0 0-1.09.217L2.146 6.793A.998.998 0 0 0 2.853 8.5H7.5c.551 0 1-.449 1-1V2.854a1 1 0 0 0-.617-.924m7.263 7.57H10.5c-.551 0-1 .449-1 1v4.646a.996.996 0 0 0 1.001 1.001 1 1 0 0 0 .706-.293l4.646-4.646a.998.998 0 0 0-.707-1.707z"/></svg>;
}

export function PipEnterIcon(props: ComponentProps<'svg'>): ReactNode {
  return <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" aria-hidden="true" viewBox="0 0 18 18" {...props}><path fill="currentColor" d="M13 2a4 4 0 0 1 4 4v2.035A3.5 3.5 0 0 0 16.5 8H15V6.273C15 5.018 13.96 4 12.679 4H4.32C3.04 4 2 5.018 2 6.273v5.454C2 12.982 3.04 14 4.321 14H6v1.5q0 .255.035.5H4a4 4 0 0 1-4-4V6a4 4 0 0 1 4-4z"/><rect width="10" height="7" x="8" y="10" fill="currentColor" rx="2"/><path fill="currentColor" d="M7.129 5.547a.6.6 0 0 0-.656.13L3.677 8.473A.6.6 0 0 0 4.102 9.5h2.796c.332 0 .602-.27.602-.602V6.103a.6.6 0 0 0-.371-.556"/></svg>;
}

export function PipExitIcon(props: ComponentProps<'svg'>): ReactNode {
  return <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" aria-hidden="true" viewBox="0 0 18 18" {...props}><path fill="currentColor" d="M13 2a4 4 0 0 1 4 4v2.036A3.5 3.5 0 0 0 16.5 8H15V6.273C15 5.018 13.96 4 12.679 4H4.32C3.04 4 2 5.018 2 6.273v5.454C2 12.982 3.04 14 4.321 14H6v1.5q0 .255.036.5H4a4 4 0 0 1-4-4V6a4 4 0 0 1 4-4z"/><rect width="10" height="7" x="8" y="10" fill="currentColor" rx="2"/><path fill="currentColor" d="M4.871 10.454a.6.6 0 0 0 .656-.131l2.796-2.796A.6.6 0 0 0 7.898 6.5H5.102a.603.603 0 0 0-.602.602v2.795a.6.6 0 0 0 .371.556"/></svg>;
}

export function SpinnerIcon(props: ComponentProps<'svg'>): ReactNode {
  return <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" aria-hidden="true" viewBox="0 0 18 18" {...props}><rect width="2" height="5" x="8" y=".5" opacity=".5" rx="1"><animate attributeName="opacity" begin="0s" calcMode="linear" dur="1s" repeatCount="indefinite" values="1;0"/></rect><rect width="2" height="5" x="12.243" y="2.257" opacity=".45" rx="1" transform="rotate(45 13.243 4.757)"><animate attributeName="opacity" begin="0.125s" calcMode="linear" dur="1s" repeatCount="indefinite" values="1;0"/></rect><rect width="5" height="2" x="12.5" y="8" opacity=".4" rx="1"><animate attributeName="opacity" begin="0.25s" calcMode="linear" dur="1s" repeatCount="indefinite" values="1;0"/></rect><rect width="5" height="2" x="10.743" y="12.243" opacity=".35" rx="1" transform="rotate(45 13.243 13.243)"><animate attributeName="opacity" begin="0.375s" calcMode="linear" dur="1s" repeatCount="indefinite" values="1;0"/></rect><rect width="2" height="5" x="8" y="12.5" opacity=".3" rx="1"><animate attributeName="opacity" begin="0.5s" calcMode="linear" dur="1s" repeatCount="indefinite" values="1;0"/></rect><rect width="2" height="5" x="3.757" y="10.743" opacity=".25" rx="1" transform="rotate(45 4.757 13.243)"><animate attributeName="opacity" begin="0.625s" calcMode="linear" dur="1s" repeatCount="indefinite" values="1;0"/></rect><rect width="5" height="2" x=".5" y="8" opacity=".15" rx="1"><animate attributeName="opacity" begin="0.75s" calcMode="linear" dur="1s" repeatCount="indefinite" values="1;0"/></rect><rect width="5" height="2" x="2.257" y="3.757" opacity=".1" rx="1" transform="rotate(45 4.757 4.757)"><animate attributeName="opacity" begin="0.875s" calcMode="linear" dur="1s" repeatCount="indefinite" values="1;0"/></rect></svg>;
}

export function RecordIcon(props: ComponentProps<'svg'>): ReactNode {
  return <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" aria-hidden="true" viewBox="0 0 18 18" {...props}><circle cx="9" cy="9" r="7" fill="currentColor"/></svg>;
}

export function StopIcon(props: ComponentProps<'svg'>): ReactNode {
  return <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" aria-hidden="true" viewBox="0 0 18 18" {...props}><rect width="10" height="10" x="4" y="4" fill="currentColor" rx="2"/></svg>;
}

export function EmojiIcon(props: ComponentProps<'svg'>): ReactNode {
  return <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" aria-hidden="true" viewBox="0 0 18 18" {...props}><circle cx="9" cy="9" r="8" stroke="currentColor" strokeWidth="1.5" fill="none"/><circle cx="6.5" cy="7.5" r="1" fill="currentColor"/><circle cx="11.5" cy="7.5" r="1" fill="currentColor"/><path d="M5.5 11.5c.667 1.167 2.1 2.5 3.5 2.5s2.833-1.333 3.5-2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/></svg>;
}

export function PeopleIcon(props: ComponentProps<'svg'>): ReactNode {
  return <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" aria-hidden="true" viewBox="0 0 18 18" {...props}><circle cx="6" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.5" fill="none"/><path d="M1 15c0-2.761 2.239-5 5-5s5 2.239 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/><circle cx="13" cy="6" r="2" stroke="currentColor" strokeWidth="1.5" fill="none"/><path d="M12 15c0-2.209 1.791-4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/></svg>;
}

export function GearIcon(props: ComponentProps<'svg'>): ReactNode {
  return <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" aria-hidden="true" viewBox="0 0 18 18" {...props}><path fill="currentColor" d="M9 11.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5"/><path fill="currentColor" fillRule="evenodd" d="M7.77 1.5a1.5 1.5 0 0 0-1.477 1.242l-.158.817a5.5 5.5 0 0 0-.892.515l-.784-.302a1.5 1.5 0 0 0-1.81.62l-1.23 2.13a1.5 1.5 0 0 0 .334 1.862l.625.515a5.5 5.5 0 0 0 0 1.031l-.625.515a1.5 1.5 0 0 0-.334 1.861l1.23 2.131a1.5 1.5 0 0 0 1.81.62l.784-.302c.278.2.578.374.892.515l.159.817A1.5 1.5 0 0 0 7.77 16.5h2.46a1.5 1.5 0 0 0 1.477-1.242l.158-.817a5.5 5.5 0 0 0 .892-.515l.784.302a1.5 1.5 0 0 0 1.81-.62l1.23-2.13a1.5 1.5 0 0 0-.334-1.862l-.625-.515a5.5 5.5 0 0 0 0-1.031l.625-.515a1.5 1.5 0 0 0 .334-1.861l-1.23-2.131a1.5 1.5 0 0 0-1.81-.62l-.784.302a5.5 5.5 0 0 0-.892-.515l-.159-.817A1.5 1.5 0 0 0 10.23 1.5zm1.23 10a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5" clipRule="evenodd"/></svg>;
}
