export const getLogTimestamp = (): string => {
  const utcTime: Date = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const now: Date = new Date(utcTime.getTime() + (utcTime.getTimezoneOffset() * 60 * 1000) + istOffset);
  const date: string = now.getDate() < 10? `0${now.getDate()}`: now.getDate().toString();
  const months: string[] = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month: string = months[now.getMonth()];
  const year: string = now.getFullYear().toString().slice(2);
  const hours: string = now.getHours() < 10? `0${now.getHours()}`: now.getHours().toString();
  const minutes: string = now.getMinutes() < 10? `0${now.getMinutes()}`: now.getMinutes().toString();
  const seconds: string = now.getSeconds() < 10? `0${now.getSeconds()}`: now.getSeconds().toString();
  return `${date}-${month}-${year} ${hours}:${minutes}:${seconds}`;
}

export const printLog = async(error: unknown, controller: string) => {
  console.log(`[ERROR][${getLogTimestamp()}] - ${controller}: ${(error as Error).message}`);
}