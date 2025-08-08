/**
 * @file logger.ts
 * @description Un utilitaire simple pour la journalisation (logging) des messages.
 * Remplace console.log pour plus de clarté et de cohérence.
 */
import color from "picocolors";
export function log(message) {
    console.log(color.green(message));
}
