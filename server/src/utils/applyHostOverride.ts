export function applyHostOverride(program: any, hostOverride?: string) {
  if (!hostOverride?.trim()) {
    return program;
  }

  return {
    ...program,

    program: {
      ...program.program,

      hosts: [hostOverride.trim()],
    },
  };
}
