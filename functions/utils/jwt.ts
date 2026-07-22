import * as jose from 'jose'

export class JwtError extends Error {
  constructor(
    message: string,
    public readonly code:
      | 'INVALID_TOKEN'
      | 'INVALID_ALGORITHM'
      | 'INVALID_SIGNATURE'
      | 'TOKEN_EXPIRED',
  ) {
    super(message)
    this.name = 'JwtError'
  }
}

/**
 * JWT Payload 类型定义
 */
export interface JwtPayload {
  userId: string
  pathPrefix?: string
  admin?: boolean
  tokenVersion?: number
}

/**
 * JWT 验证结果类型
 */
export interface JwtVerifyResult {
  userId: string
  exp: number
  pathPrefix?: string
  admin?: boolean
  tokenVersion?: number
}

export async function verifyJwt(token: string, secret: string): Promise<JwtVerifyResult> {
  try {
    const encoder = new TextEncoder()
    const key = encoder.encode(secret)

    const { payload } = await jose.jwtVerify(token, key, {
      algorithms: ['HS256'],
    })

    return {
      userId: (payload.userId as string) || 'user',
      exp: payload.exp!,
      pathPrefix: payload.pathPrefix as string | undefined,
      admin: payload.admin as boolean | undefined,
      tokenVersion: payload.tokenVersion as number | undefined,
    }
  } catch (err) {
    // 统一返回模糊错误信息，避免泄露令牌具体状态
    if (err instanceof jose.errors.JWTExpired) {
      throw new JwtError('令牌无效', 'TOKEN_EXPIRED')
    }
    if (err instanceof jose.errors.JWTClaimValidationFailed) {
      throw new JwtError('令牌无效', 'INVALID_SIGNATURE')
    }
    if (err instanceof jose.errors.JWSSignatureVerificationFailed) {
      throw new JwtError('令牌无效', 'INVALID_SIGNATURE')
    }

    throw new JwtError('令牌无效', 'INVALID_TOKEN')
  }
}

export async function createJwt(
  payload: JwtPayload,
  secret: string,
  expiresIn: number = 86400,
): Promise<string> {
  const encoder = new TextEncoder()
  const key = encoder.encode(secret)

  const jwt = await new jose.SignJWT(payload as unknown as jose.JWTPayload)
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setExpirationTime(`${expiresIn}s`)
    .setIssuedAt()
    .sign(key)

  return jwt
}
