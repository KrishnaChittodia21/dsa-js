# TeaVM javac (in-browser Java compiler) — vendored for M7

Copied unchanged on 2026-11-06 from the official TeaVM playground build, https://teavm.org/playground/3/
(source: https://github.com/konsoletyper/teavm-javac, master at 76b5b53). Used by `src/runner/native/runNative.js`.

| file | sha256 |
|---|---|
| worker.js | 20045d5e753b14774e0b6ee65541cff6a15f6747813227ed665152613f08810a |
| compiler.wasm | 7f3828e4b7bddf5504dadebfc4016e40f4441e15ee0519071781813ba2ed3a4c |
| compiler.wasm-runtime.js | 9ff6a6771f698be00ab9d5c7b46d904350a8d4115dc0b409553f31ed66688a55 |
| compile-classlib-teavm.bin | e80ae10423a39290c5f20b6bb6da34d21c3ad0a75cd8dbdda4998d2813045e15 |
| runtime-classlib-teavm.bin | ea670e71967eda93828cb894c1741a8ed2e94b3422eb99cb9eccec0de67daaa8 |

Licenses: TeaVM is Apache-2.0; javac and the Java class library come from OpenJDK (GPL-2.0 with the Classpath
exception). The teavm-javac repository has no top-level LICENSE file; this was not verified further.
Known gaps (TeaVM class library): `Map.Entry` and `Integer::sum` do not compile; see design/m7-spike.md.
