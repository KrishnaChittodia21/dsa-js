// M7: just enough WASI (preview 1) to run a compiled C++ test program in a worker: stdin is the encoded tests,
// stdout / stderr go to callbacks, no files. Anything else answers ENOSYS. (Saves a dependency for ~60 lines.)
const EBADF = 8;
const ENOSYS = 52;
const ESPIPE = 70;

export class WasiExit extends Error {
  constructor(code) {
    super(`exit ${code}`);
    this.code = code;
  }
}

/** { imports, setMemory } for WebAssembly.instantiate(module, { wasi_snapshot_preview1: imports }) */
export function wasi(input, onStdout, onStderr) {
  let memory;
  const stdin = new TextEncoder().encode(input);
  let pos = 0;
  const decoders = { 1: new TextDecoder(), 2: new TextDecoder() };
  const sinks = { 1: onStdout, 2: onStderr };
  const view = () => new DataView(memory.buffer);
  const bytes = () => new Uint8Array(memory.buffer);
  // walk an iovec array, calling fn(ptr, len) → bytes handled; stops at a short read
  const iovecs = (ptr, count, fn) => {
    let total = 0;
    for (let i = 0; i < count; i++) {
      const v = view();
      const len = v.getUint32(ptr + i * 8 + 4, true);
      const n = fn(v.getUint32(ptr + i * 8, true), len);
      total += n;
      if (n < len) break;
    }
    return total;
  };
  const imports = {
    fd_read(fd, iov, count, nread) {
      if (fd !== 0) return EBADF;
      const n = iovecs(iov, count, (p, len) => {
        const k = Math.min(len, stdin.length - pos);
        bytes().set(stdin.subarray(pos, pos + k), p);
        pos += k;
        return k;
      });
      view().setUint32(nread, n, true);
      return 0;
    },
    fd_write(fd, iov, count, nwritten) {
      if (!sinks[fd]) return EBADF;
      const n = iovecs(iov, count, (p, len) => {
        sinks[fd](decoders[fd].decode(bytes().slice(p, p + len), { stream: true }));
        return len;
      });
      view().setUint32(nwritten, n, true);
      return 0;
    },
    fd_fdstat_get(fd, out) {
      if (fd > 2) return EBADF;
      const v = view();
      v.setUint8(out, 2); // a character device
      v.setUint16(out + 2, 0, true);
      v.setBigUint64(out + 8, 0n, true);
      v.setBigUint64(out + 16, 0n, true);
      return 0;
    },
    fd_close: () => 0,
    fd_seek: () => ESPIPE,
    fd_prestat_get: () => EBADF,
    fd_prestat_dir_name: () => EBADF,
    proc_exit(code) {
      throw new WasiExit(code);
    },
    args_sizes_get(argc, size) {
      view().setUint32(argc, 0, true);
      view().setUint32(size, 0, true);
      return 0;
    },
    args_get: () => 0,
    environ_sizes_get(count, size) {
      view().setUint32(count, 0, true);
      view().setUint32(size, 0, true);
      return 0;
    },
    environ_get: () => 0,
    clock_time_get(id, _precision, out) {
      const ms = id === 0 ? Date.now() : performance.now(); // 0 = realtime, else monotonic
      view().setBigUint64(out, BigInt(Math.round(ms * 1e6)), true);
      return 0;
    },
    clock_res_get(_id, out) {
      view().setBigUint64(out, 1000n, true);
      return 0;
    },
    random_get(p, len) {
      for (let i = 0; i < len; i += 65536) crypto.getRandomValues(bytes().subarray(p + i, p + Math.min(len, i + 65536)));
      return 0;
    },
    sched_yield: () => 0,
  };
  return {
    imports: new Proxy(imports, { get: (t, k) => t[k] || (() => ENOSYS) }),
    setMemory: (m) => (memory = m),
  };
}
