import { DateTime } from 'luxon'

export const logl = (message?: any, ...optionalParams: any[]) => {
  console.log(`[${DateTime.utc().toFormat('yyyy-MM-dd HH:mm:ss.SSS')}]Z${message}`, ...optionalParams)
}
