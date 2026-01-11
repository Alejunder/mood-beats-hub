/**
 * Validación simplificada de auth intent - Solo frontend
 * Usa solo timestamps del cliente para validar
 */

/**
 * Valida el intent del usuario basándose en el timestamp de creación
 * @param {'login'|'signup'} intent - Intención del usuario
 * @param {number} flowStartedAtTimestamp - Timestamp de cuando se inició el flujo
 * @param {string} userCreatedAt - ISO string de cuando se creó el usuario
 * @returns {{valid: boolean, error?: string, error_code?: string, should_logout?: boolean}}
 */
export function validateAuthIntentSimple(intent, flowStartedAtTimestamp, userCreatedAt) {
  try {
    const flowStartTime = new Date(flowStartedAtTimestamp);
    const userCreatedTime = new Date(userCreatedAt);
    const now = new Date();

    // Calcular diferencias
    const timeSinceUserCreation = now - userCreatedTime; // ms desde que se creó el usuario
    const timeSinceFlowStart = now - flowStartTime; // ms desde que se inició el flujo
    const creationVsFlow = userCreatedTime - flowStartTime; // diferencia entre creación y flow

    console.log('📊 Análisis de timestamps:', {
      flowStartTime: flowStartTime.toISOString(),
      userCreatedTime: userCreatedTime.toISOString(),
      now: now.toISOString(),
      timeSinceUserCreation: `${Math.round(timeSinceUserCreation / 1000)}s`,
      timeSinceFlowStart: `${Math.round(timeSinceFlowStart / 1000)}s`,
      creationVsFlow: `${Math.round(creationVsFlow / 1000)}s`
    });

    // Usuario es "nuevo" si fue creado después de que se inició el flujo
    // (con margen de 5 minutos para el proceso OAuth)
    const isNewUser = creationVsFlow >= -5000 && creationVsFlow <= 300000;
    
    // Usuario es "existente" si fue creado mucho antes del flujo
    const wasExistingUser = creationVsFlow < -10000;

    console.log('🔍 Determinación:', {
      intent,
      isNewUser,
      wasExistingUser
    });

    // VALIDACIÓN 1: Signup con cuenta existente
    if (intent === 'signup' && wasExistingUser) {
      console.warn('❌ Signup con cuenta existente detectado');
      return {
        valid: false,
        error: 'accountExistsPleaseLogin',
        error_code: 'ACCOUNT_EXISTS',
        should_logout: true
      };
    }

    // VALIDACIÓN 2: Login con cuenta nueva
    if (intent === 'login' && isNewUser) {
      console.warn('❌ Login con cuenta nueva detectado');
      return {
        valid: false,
        error: 'noAccountPleaseSignup',
        error_code: 'NO_ACCOUNT',
        should_logout: true
      };
    }

    // Todo OK
    console.log('✅ Validación simple exitosa');
    return {
      valid: true,
      is_new_user: isNewUser
    };
  } catch (error) {
    console.error('❌ Error en validateAuthIntentSimple:', error);
    // En caso de error, permitir continuar
    return {
      valid: true,
      fallback: true
    };
  }
}
