import { PLANNIC_VERSION } from "@plannic/core";

export const PLANNIC_ASCII_LOGO = `
  ██████╗ ██╗      █████╗ ███╗   ██╗███╗   ██╗██╗ ██████╗
  ██╔══██╗██║     ██╔══██╗████╗  ██║████╗  ██║██║██╔════╝
  ██████╔╝██║     ███████║██╔██╗ ██║██╔██╗ ██║██║██║     
  ██╔═══╝ ██║     ██╔══██║██║╚██╗██║██║╚██╗██║██║██║     
  ██║     ███████╗██║  ██║██║ ╚████║██║ ╚████║██║╚██████╗
  ╚═╝     ╚══════╝╚═╝  ╚═╝╚═╝  ╚═══╝╚═╝  ╚═══╝╚═╝ ╚═════╝`;

export const PLANNIC_ASCII_COMPACT = `
   ____  _        _    _   _ _   _ ___ ____ 
  |  _ \\| |      / \\  | \\ | | \\ | |_ _/ ___|
  | |_) | |     / _ \\ |  \\| |  \\| || | |    
  |  __/| |___ / ___ \\| |\\  | |\\  || | |___ 
  |_|   |_____/_/   \\_\\_| \\_|_| \\_|___\\____|`;

export function printAsciiBanner(compact = false) {
  const logo = compact ? PLANNIC_ASCII_COMPACT : PLANNIC_ASCII_LOGO;
  console.log(`\x1b[1m\x1b[36m${logo}\x1b[0m`);
  console.log(`  \x1b[1m\x1b[38;2;56;189;248mPlannic CLI\x1b[0m \x1b[90m/\x1b[0m \x1b[37mArchitecture, Living Specs & Planning Workbench\x1b[0m \x1b[90mv${PLANNIC_VERSION}\x1b[0m\n`);
}
