type LogtoConfig = {
  endpoint: string
  appId: string
}

const config: LogtoConfig = {
  endpoint: process.env.NEXT_PUBLIC_LOGTO_ENDPOINT ?? '',
  appId: process.env.NEXT_PUBLIC_LOGTO_APP_ID ?? '',
}

export const logtoClientConfig = config
