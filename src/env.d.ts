/// <reference types="astro/client" />

declare const __APP_VERSION__: string;

declare namespace App {
  interface Locals {
    userId: number | null;
    userDisplayName: string;
  }
}
