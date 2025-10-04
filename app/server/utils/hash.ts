import argon2 from 'argon2'
export const hash = (p: string) => argon2.hash(p, { type: argon2.argon2id })
export const verify = (h: string, p: string) => argon2.verify(h, p)

