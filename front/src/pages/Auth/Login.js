"use client"
import { useState } from "react"
import { useAuth } from "../../contexts/AuthContext"
import { authService } from "../../services/dataService"
import Button from "../../components/UI/Button"
import Input from "../../components/UI/Input"
import "./Login.css"

const Login = () => {
  const [step, setStep] = useState("email")
  const [email, setEmail] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  const { login } = useAuth()

  const handleSendCode = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      await authService.sendCode(email)
      setMessage("Código enviado a tu correo electrónico")
      setStep("code")
    } catch (err) {
      setError(err.response?.data?.message || "Error al enviar el código")
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyCode = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      // Enviar firstName y lastName al backend
      const response = await authService.verifyCode(email, code, firstName, lastName)
      
      // Usar los datos del usuario devueltos por el backend
      const userData = {
        id: response.user.id,
        email: response.user.email,
        firstName: response.user.firstName,
        lastName: response.user.lastName,
        fullName: `${response.user.firstName} ${response.user.lastName}`,
        token: "authenticated"
      }

      login(userData)
    } catch (err) {
      setError(err.response?.data?.message || "Código incorrecto")
    } finally {
      setLoading(false)
    }
  }

  const handleBackToEmail = () => {
    setStep("email")
    setCode("")
    setError("")
    setMessage("")
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-icon">🏪</div>
          <h1 className="login-title">Store Management</h1>
          <p className="login-subtitle">Sistema de Gestión</p>
        </div>

        {message && <div className="message message-success">{message}</div>}
        {error && <div className="message message-error">{error}</div>}

        <form onSubmit={step === "email" ? handleSendCode : handleVerifyCode} className="login-form">
          <div className="form-step">
            {step === "email" ? (
              <>
                <h2 className="step-title">Acceso al Sistema</h2>
                <p className="step-description">
                  Completa los datos para recibir un código de acceso
                </p>
                
                <div className="form-fields">
                  <Input
                    label="Nombre"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Tu nombre"
                    required
                    icon="👤"
                  />
                  
                  <Input
                    label="Apellido"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Tu apellido"
                    required
                    icon="👤"
                  />
                  
                  <Input
                    label="Correo electrónico"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                    required
                    icon="📧"
                  />
                </div>
              </>
            ) : (
              <>
                <h2 className="step-title">Verificación</h2>
                <p className="step-description">
                  Hola <strong>{firstName} {lastName}</strong>, 
                  código enviado a: <strong>{email}</strong>
                </p>
                
                <div className="verification-info">
                  <div className="code-info">
                    <span className="code-icon">🔐</span>
                    <div>
                      <p className="code-text">Revisa tu correo electrónico</p>
                      <p className="code-subtext">El código expira en 10 minutos</p>
                    </div>
                  </div>
                </div>
                
                <Input
                  label="Código de verificación"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="123456"
                  required
                  maxLength={6}
                  icon="🔢"
                  className="code-input"
                />
              </>
            )}
          </div>

          <div className="login-actions">
            {step === "email" ? (
              <Button 
                type="submit" 
                disabled={loading || !email || !firstName.trim() || !lastName.trim()}
                variant="primary"
                className="submit-btn"
              >
                {loading && <span className="loading-spinner"></span>}
                {loading ? "Enviando código..." : "Enviar código"}
              </Button>
            ) : (
              <div className="verification-actions">
                <Button 
                  type="button" 
                  variant="secondary" 
                  onClick={handleBackToEmail}
                  className="back-btn"
                >
                  ← Cambiar datos
                </Button>
                <Button 
                  type="submit" 
                  disabled={loading || code.length !== 6}
                  variant="primary"
                  className="verify-btn"
                >
                  {loading && <span className="loading-spinner"></span>}
                  {loading ? "Verificando..." : "Ingresar al sistema"}
                </Button>
              </div>
            )}
          </div>
        </form>

        <div className="login-footer">
          <p className="footer-text">
            Al continuar, aceptas nuestros términos de servicio
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
