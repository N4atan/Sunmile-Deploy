/* =============================
   SETTINGS MENU + THEME
============================= */

const settingsButton = document.querySelector('.settings')
const settingsMenu = document.querySelector('.settings-menu')
const darkToggle = document.querySelector('#darkModeToggle')

settingsButton?.addEventListener('click', (e) => {
	e.stopPropagation()
	settingsMenu.classList.toggle('active')

	if (!settingsMenu.classList.contains('active')) return

	const rect = settingsButton.getBoundingClientRect()
	const padding = 8

	let left = rect.right + padding
	let top = rect.top

	if (left + settingsMenu.offsetWidth > window.innerWidth) {
		left = rect.left - settingsMenu.offsetWidth - padding
	}

	if (top + settingsMenu.offsetHeight > window.innerHeight) {
		top = window.innerHeight - settingsMenu.offsetHeight - padding
	}

	settingsMenu.style.left = `${left}px`
	settingsMenu.style.top = `${top}px`
})

document.addEventListener('click', (e) => {
	if (!settingsMenu?.contains(e.target) && !settingsButton?.contains(e.target)) {
		settingsMenu?.classList.remove('active')
	}
})

darkToggle?.addEventListener('change', () => {
	document.body.classList.toggle('dark-theme', darkToggle.checked)
	localStorage.setItem('darkMode', darkToggle.checked ? '1' : '0')
})

if (localStorage.getItem('darkMode') === '1') {
	document.body.classList.add('dark-theme')
	if (darkToggle) darkToggle.checked = true
}

/* =============================
   GLOBAL CONFIG
============================= */

const API_BASE = 'https://sunmile-back.vercel.app/sunmile'
const token = localStorage.getItem('token')

const pageContainer = document.getElementById('page-container')
const links = document.querySelectorAll('.menu a')

/* =============================
   CURRENT USER
============================= */

async function fetchCurrentUser() {
	try {
		const res = await fetch(`${API_BASE}/me/user`, {
			headers: { Authorization: `Bearer ${token}` }
		})
		if (!res.ok) throw new Error()
		return await res.json()
	} catch {
		return null
	}
}

async function fetchCurrentProfessional() {
	try {
		const res = await fetch(`${API_BASE}/me/pro`, {
			headers: { Authorization: `Bearer ${token}` }
		})
		if (!res.ok) return null
		return await res.json()
	} catch {
		return null
	}
}

/* =============================
   SPA NAVIGATION
============================= */

async function loadPage(page) {
	try {
		if (page === 'posts') {
			const res = await fetch('../pages/pro-post.html')
			pageContainer.innerHTML = await res.text()
			await toggleCreatePostButton()
			loadPosts()
			setupPostModal()
			return
		}

		if (page === 'professionals') {
			const res = await fetch('../pages/professionals.html')
			pageContainer.innerHTML = await res.text()
			loadProfessionals()
			return
		}

		if (page === 'account') {
			const user = await fetchCurrentUser()
			if (!user) return

			if (user.role === 'pro') {
				const professional = await fetchCurrentProfessional()
				if (professional) user.professional = professional
			}

			const pageName = user.role === 'pro' ? 'account-pro' : 'account-user'
			const res = await fetch(`../pages/${pageName}.html`)
			pageContainer.innerHTML = await res.text()

			loadProfile(user)
			return
		}

		const res = await fetch(`../pages/${page}.html`)
		pageContainer.innerHTML = await res.text()

	} catch {
		pageContainer.innerHTML = '<p>Erro ao carregar página.</p>'
	}
}

links.forEach(link => {
	link.addEventListener('click', (e) => {
		e.preventDefault()
		loadPage(link.dataset.page)
	})
})

/* =============================
   POSTS
============================= */

async function toggleCreatePostButton() {
	const btn = document.getElementById('create-post-btn')
	if (!btn) return

	const user = await fetchCurrentUser()
	btn.style.display = user?.role === 'pro' ? 'inline-block' : 'none'
}

async function loadPosts() {
	const container = document.getElementById('posts-list')
	if (!container) return

	try {
		const res = await fetch(`${API_BASE}/pro-posts`)
		const posts = await res.json()

		container.innerHTML = posts.map(post => `
			<div class="post-card">
				<div class="post-header">
					<div class="post-avatar">
						${post.professional.user.profile_pic_url
							? `<img src="${post.professional.user.profile_pic_url}">`
							: post.professional.user.name.charAt(0)}
					</div>
					<div>
						<strong>${post.professional.user.name}</strong>
						<span>@${post.professional.user.username}</span>
					</div>
				</div>
				<h3>${post.title}</h3>
				<p>${post.content}</p>
			</div>
		`).join('')
	} catch {
		container.innerHTML = '<p>Erro ao carregar posts.</p>'
	}
}

/* =============================
   PROFESSIONALS
============================= */

let professionalsCache = []

async function loadProfessionals() {
	const container = document.getElementById('professionals-list')
	if (!container) return

	try {
		const res = await fetch(`${API_BASE}/professionals`)
		const professionals = await res.json()
		professionalsCache = professionals

		container.innerHTML = professionals.map((pro, index) => `
			<div class="professional-card">
				<div class="professional-header">
					<div class="professional-avatar">
						${pro.user.profile_pic_url
							? `<img src="${pro.user.profile_pic_url}">`
							: pro.user.name.charAt(0)}
					</div>
					<div>
						<strong>${pro.user.name}</strong>
						<span>@${pro.user.username}</span>
					</div>
				</div>

				<p><strong>Registro:</strong> ${pro.pro_registration}</p>
				<p><strong>Telefone:</strong> ${pro.phone_number}</p>

				${pro.bio ? `
					<button class="show-more-btn"
						onclick="openProfessionalModal(${index})">
						Exibir mais
					</button>` : ''}
			</div>
		`).join('')
	} catch {
		container.innerHTML = '<p>Erro ao carregar profissionais.</p>'
	}
}

function openProfessionalModal(index) {
	const pro = professionalsCache[index]
	const modal = document.getElementById('professional-modal')

	const avatar = document.getElementById('modal-avatar')
	avatar.innerHTML = pro.user.profile_pic_url
		? `<img src="${pro.user.profile_pic_url}">`
		: pro.user.name.charAt(0)

	document.getElementById('modal-name').textContent = pro.user.name
	document.getElementById('modal-username').textContent = '@' + pro.user.username
	document.getElementById('modal-registration').textContent = pro.pro_registration
	document.getElementById('modal-phone').textContent = pro.phone_number
	document.getElementById('modal-bio').textContent = pro.bio || ''

	modal.classList.remove('hidden')
}

function closeProfessionalModal() {
	document.getElementById('professional-modal').classList.add('hidden')
}

window.openProfessionalModal = openProfessionalModal
window.closeProfessionalModal = closeProfessionalModal

/* =============================
   PROFILE + CROPPER
============================= */

let cropper = null

function loadProfile(user) {
	const avatarImg = document.getElementById('profile-avatar')
	const avatarInput = document.getElementById('avatar-input')

	avatarImg.src = user.profile_pic_url || '../assets/img/avatar-default.png'

	avatarImg.onclick = () => avatarInput.click()

	avatarInput.onchange = () => {
		const file = avatarInput.files[0]
		if (!file) return

		const reader = new FileReader()
		reader.onload = () => {
			const modal = document.getElementById('cropper-modal')
			const image = document.getElementById('cropper-image')

			image.src = reader.result
			modal.classList.remove('hidden')

			if (cropper) cropper.destroy()

			cropper = new Cropper(image, {
				aspectRatio: 1,
				viewMode: 1,
				preview: '.cropper-preview',
				zoomable: true
			})
		}
		reader.readAsDataURL(file)
	}

	document.getElementById('cancel-crop').onclick = () => {
		document.getElementById('cropper-modal').classList.add('hidden')
		cropper?.destroy()
		cropper = null
	}

	document.getElementById('confirm-crop').onclick = async () => {
		const canvas = cropper.getCroppedCanvas({ width: 400, height: 400 })

		canvas.toBlob(async blob => {
			const fd = new FormData()
			fd.append('file', blob)
			fd.append('upload_preset', 'sunmile_unsigned')

			const res = await fetch(
				'https://api.cloudinary.com/v1_1/dgvwjb1cj/image/upload',
				{ method: 'POST', body: fd }
			)

			const data = await res.json()
			avatarImg.src = data.secure_url

			await fetch(`${API_BASE}/users/me/avatar`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`
				},
				body: JSON.stringify({ profile_pic_url: data.secure_url })
			})

			document.getElementById('cropper-modal').classList.add('hidden')
			cropper.destroy()
			cropper = null
		})
	}
}

/* =============================
   LOGOUT
============================= */

document.querySelector('.logout-btn')?.addEventListener('click', () => {
	localStorage.removeItem('token')
	window.location.href = '../pages/index.html'
})
