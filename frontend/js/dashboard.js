let currentUser = null
const API_URL = "https://api.example.com" // Declare API_URL

async function checkAuth() {
  // Mock implementation for checkAuth
  return { nombre: "John Doe", rol: "ADMIN", id: 1 }
}

function formatDate(date) {
  // Mock implementation for formatDate
  return new Date(date).toLocaleDateString()
}

function getStatusBadgeClass(status) {
  // Mock implementation for getStatusBadgeClass
  return status === "PENDIENTE" ? "warning" : "success"
}

function formatDateTime(dateTime) {
  // Mock implementation for formatDateTime
  return new Date(dateTime).toLocaleString()
}

function showSuccess(message) {
  // Mock implementation for showSuccess
  alert(message)
}

function showError(message) {
  // Mock implementation for showError
  alert(message)
}

async function init() {
  currentUser = await checkAuth()
  if (!currentUser) return

  document.getElementById("userNameDisplay").textContent = currentUser.nombre

  if (currentUser.rol === "ADMIN") {
    document.getElementById("adminSection").style.display = "block"
    loadUsers()
    loadLogs()
  }

  loadStats()
  loadRecentReservations()
}

async function loadStats() {
  try {
    const response = await fetch(`${API_URL}/dashboard/stats`, {
      credentials: "include",
    })
    const data = await response.json()

    document.getElementById("totalAulas").textContent = data.aulas.total
    document.getElementById("aulasLibres").textContent = data.aulas.libres
    document.getElementById("aulasOcupadas").textContent = data.aulas.ocupadas
    document.getElementById("totalRecursos").textContent = data.recursos.total
    document.getElementById("recursosDanados").textContent = data.recursos.danados
    document.getElementById("reservasActivas").textContent = data.reservas.activas
    document.getElementById("reservasHoy").textContent = data.reservas.hoy
    document.getElementById("totalUsuarios").textContent = data.usuarios.total
  } catch (error) {
    console.error("Error al cargar estadísticas:", error)
  }
}

async function loadRecentReservations() {
  try {
    const response = await fetch(`${API_URL}/dashboard/reservas-recientes`, {
      credentials: "include",
    })
    const reservations = await response.json()

    const tbody = document.getElementById("recentReservationsTable")

    if (reservations.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center">No hay reservas recientes</td></tr>'
      return
    }

    tbody.innerHTML = reservations
      .map(
        (r) => `
            <tr>
                <td>${r.aula}</td>
                <td>${r.modulo}</td>
                <td>${r.instructor}</td>
                <td>${formatDate(r.fecha)}</td>
                <td>${r.hora_inicio} - ${r.hora_fin}</td>
                <td><span class="badge ${getStatusBadgeClass(r.estado)}">${r.estado}</span></td>
            </tr>
        `,
      )
      .join("")
  } catch (error) {
    console.error("Error al cargar reservas recientes:", error)
  }
}

async function loadUsers() {
  try {
    const response = await fetch(`${API_URL}/users`, {
      credentials: "include",
    })
    const users = await response.json()

    const tbody = document.getElementById("usersTable")

    if (users.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center">No hay usuarios registrados</td></tr>'
      return
    }

    tbody.innerHTML = users
      .map(
        (u) => `
            <tr>
                <td>${u.nombre}</td>
                <td>${u.email}</td>
                <td><span class="badge ${u.rol === "ADMIN" ? "warning" : "info"}">${u.rol}</span></td>
                <td>${u.telefono || "-"}</td>
                <td>
                    <button class="btn-secondary btn-sm" onclick="editUser(${u.id})">Editar</button>
                    ${u.id !== currentUser.id ? `<button class="btn-danger btn-sm" onclick="deleteUser(${u.id})">Eliminar</button>` : ""}
                </td>
            </tr>
        `,
      )
      .join("")
  } catch (error) {
    console.error("Error al cargar usuarios:", error)
  }
}

function showUserModal(userId = null) {
  document.getElementById("userModal").style.display = "block"
  document.getElementById("userForm").reset()
  document.getElementById("userId").value = ""
  document.getElementById("userModalTitle").textContent = "Nuevo Usuario"

  if (userId) {
    document.getElementById("userModalTitle").textContent = "Editar Usuario"
  }
}

function closeUserModal() {
  document.getElementById("userModal").style.display = "none"
}

document.getElementById("userForm").addEventListener("submit", async (e) => {
  e.preventDefault()

  const userId = document.getElementById("userId").value
  const nombre = document.getElementById("userName").value
  const email = document.getElementById("userEmail").value
  const password = document.getElementById("userPassword").value
  const rol = document.getElementById("userRole").value
  const telefono = document.getElementById("userPhone").value

  const body = { nombre, email, rol, telefono }
  if (password) body.password = password

  try {
    const url = userId ? `${API_URL}/users/${userId}` : `${API_URL}/users`
    const method = userId ? "PUT" : "POST"

    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(body),
    })

    if (response.ok) {
      showSuccess("Usuario guardado exitosamente")
      closeUserModal()
      loadUsers()
    } else {
      const data = await response.json()
      showError(data.error || "Error al guardar usuario")
    }
  } catch (error) {
    console.error("Error:", error)
    showError("Error de conexión")
  }
})

async function editUser(userId) {
  try {
    const response = await fetch(`${API_URL}/users`, {
      credentials: "include",
    })
    const users = await response.json()
    const user = users.find((u) => u.id === userId)

    if (user) {
      document.getElementById("userId").value = user.id
      document.getElementById("userName").value = user.nombre
      document.getElementById("userEmail").value = user.email
      document.getElementById("userRole").value = user.rol
      document.getElementById("userPhone").value = user.telefono || ""
      document.getElementById("userPassword").value = ""
      showUserModal(userId)
    }
  } catch (error) {
    console.error("Error:", error)
  }
}

async function deleteUser(userId) {
  if (!confirm("¿Está seguro de eliminar este usuario?")) return

  try {
    const response = await fetch(`${API_URL}/users/${userId}`, {
      method: "DELETE",
      credentials: "include",
    })

    if (response.ok) {
      showSuccess("Usuario eliminado exitosamente")
      loadUsers()
    } else {
      const data = await response.json()
      showError(data.error || "Error al eliminar usuario")
    }
  } catch (error) {
    console.error("Error:", error)
    showError("Error de conexión")
  }
}

async function loadLogs() {
  try {
    const dateFrom = document.getElementById("logDateFrom").value
    const dateTo = document.getElementById("logDateTo").value
    const action = document.getElementById("logAction").value

    const params = new URLSearchParams()
    if (dateFrom) params.append("fecha_desde", dateFrom)
    if (dateTo) params.append("fecha_hasta", dateTo)
    if (action) params.append("accion", action)

    const response = await fetch(`${API_URL}/logs?${params}`, {
      credentials: "include",
    })
    const logs = await response.json()

    const tbody = document.getElementById("logsTable")

    if (logs.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center">No hay registros</td></tr>'
      return
    }

    tbody.innerHTML = logs
      .map(
        (l) => `
            <tr>
                <td>${formatDateTime(l.creado_en)}</td>
                <td>${l.usuario_nombre || "Sistema"}</td>
                <td>${l.accion}</td>
                <td>${l.tabla || "-"}</td>
                <td>${l.detalles || "-"}</td>
            </tr>
        `,
      )
      .join("")
  } catch (error) {
    console.error("Error al cargar logs:", error)
  }
}

window.onclick = (event) => {
  if (event.target.classList.contains("modal")) {
    event.target.style.display = "none"
  }
}

init()
