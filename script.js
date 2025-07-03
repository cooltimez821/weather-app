class ProjectManager {
    constructor() {
        this.projects = this.loadProjects();
        this.currentFilter = 'all';
        this.searchTerm = '';
        this.init();
    }

    init() {
        this.renderProjects();
        this.setupEventListeners();
        this.loadSampleData();
    }

    setupEventListeners() {
        // Modal controls
        document.getElementById('addProjectBtn').addEventListener('click', () => {
            document.getElementById('addProjectModal').style.display = 'block';
        });

        document.getElementById('closeModal').addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('cancelBtn').addEventListener('click', () => {
            this.closeModal();
        });

        // Close modal when clicking outside
        document.getElementById('addProjectModal').addEventListener('click', (e) => {
            if (e.target.id === 'addProjectModal') {
                this.closeModal();
            }
        });

        // Form submission
        document.getElementById('projectForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addProject();
        });

        // Search functionality
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.searchTerm = e.target.value.toLowerCase();
            this.renderProjects();
        });

        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Remove active class from all buttons
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                // Add active class to clicked button
                e.target.classList.add('active');
                this.currentFilter = e.target.dataset.filter;
                this.renderProjects();
            });
        });

        // File preview
        document.getElementById('projectScreenshot').addEventListener('change', (e) => {
            this.previewFile(e.target.files[0]);
        });
    }

    previewFile(file) {
        const preview = document.getElementById('filePreview');
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                preview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
            };
            reader.readAsDataURL(file);
        } else {
            preview.innerHTML = '';
        }
    }

    closeModal() {
        document.getElementById('addProjectModal').style.display = 'none';
        document.getElementById('projectForm').reset();
        document.getElementById('filePreview').innerHTML = '';
    }

    addProject() {
        const form = document.getElementById('projectForm');
        const formData = new FormData(form);
        const file = formData.get('screenshot');

        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const project = {
                    id: Date.now(),
                    title: formData.get('title'),
                    description: formData.get('description'),
                    link: formData.get('link'),
                    category: formData.get('category'),
                    screenshot: e.target.result,
                    tags: formData.get('tags').split(',').map(tag => tag.trim()).filter(tag => tag),
                    dateAdded: new Date().toISOString()
                };

                this.projects.unshift(project);
                this.saveProjects();
                this.renderProjects();
                this.closeModal();
                this.showNotification('Project added successfully!');
            };
            reader.readAsDataURL(file);
        }
    }

    loadProjects() {
        const stored = localStorage.getItem('vibeProjects');
        return stored ? JSON.parse(stored) : [];
    }

    saveProjects() {
        localStorage.setItem('vibeProjects', JSON.stringify(this.projects));
    }

    filterProjects() {
        let filtered = this.projects;

        // Filter by category
        if (this.currentFilter !== 'all') {
            filtered = filtered.filter(project => project.category === this.currentFilter);
        }

        // Filter by search term
        if (this.searchTerm) {
            filtered = filtered.filter(project => 
                project.title.toLowerCase().includes(this.searchTerm) ||
                project.description.toLowerCase().includes(this.searchTerm) ||
                project.tags.some(tag => tag.toLowerCase().includes(this.searchTerm))
            );
        }

        return filtered;
    }

    renderProjects() {
        const grid = document.getElementById('projectsGrid');
        const filtered = this.filterProjects();

        if (filtered.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-code"></i>
                    <h3>No projects found</h3>
                    <p>Be the first to add a project or try adjusting your filters</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = filtered.map(project => `
            <div class="project-card" data-category="${project.category}">
                <img src="${project.screenshot}" alt="${project.title}" class="project-image">
                <div class="project-content">
                    <h3 class="project-title">${project.title}</h3>
                    <p class="project-description">${project.description}</p>
                    <div class="project-tags">
                        ${project.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                    <div class="project-footer">
                        <a href="${project.link}" target="_blank" class="project-link">
                            <i class="fas fa-external-link-alt"></i>
                            View Project
                        </a>
                        <span class="project-category">${this.getCategoryName(project.category)}</span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    getCategoryName(category) {
        const categories = {
            'web': 'Web Dev',
            'mobile': 'Mobile',
            'desktop': 'Desktop',
            'game': 'Game'
        };
        return categories[category] || category;
    }

    showNotification(message) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4CAF50;
            color: white;
            padding: 1rem 2rem;
            border-radius: 8px;
            z-index: 1001;
            animation: slideInRight 0.3s ease;
        `;

        // Add animation styles
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);

        document.body.appendChild(notification);

        // Remove notification after 3 seconds
        setTimeout(() => {
            notification.remove();
            style.remove();
        }, 3000);
    }

    loadSampleData() {
        // Only load sample data if no projects exist
        if (this.projects.length === 0) {
            const sampleProjects = [
                {
                    id: 1,
                    title: "Task Manager Pro",
                    description: "A beautiful task management app with drag-and-drop functionality and real-time collaboration features.",
                    link: "https://github.com/example/task-manager",
                    category: "web",
                    screenshot: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDQwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjNjY3ZWVhIi8+Cjx0ZXh0IHg9IjIwMCIgeT0iMTAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjI0Ij5UYXNrIE1hbmFnZXI8L3RleHQ+Cjwvc3ZnPg==",
                    tags: ["React", "TypeScript", "Node.js", "MongoDB"],
                    dateAdded: new Date().toISOString()
                },
                {
                    id: 2,
                    title: "Weather Widget",
                    description: "An elegant weather application with animated backgrounds and detailed forecasts.",
                    link: "https://github.com/example/weather-widget",
                    category: "web",
                    screenshot: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDQwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjNzY0YmEyIi8+Cjx0ZXh0IHg9IjIwMCIgeT0iMTAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjI0Ij5XZWF0aGVyIEFwcDwvdGV4dD4KPC9zdmc+",
                    tags: ["JavaScript", "CSS3", "API", "Animation"],
                    dateAdded: new Date().toISOString()
                },
                {
                    id: 3,
                    title: "Mobile Fitness Tracker",
                    description: "Cross-platform fitness tracking app with workout plans and progress visualization.",
                    link: "https://github.com/example/fitness-tracker",
                    category: "mobile",
                    screenshot: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDQwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjNDBkZGI2Ii8+Cjx0ZXh0IHg9IjIwMCIgeT0iMTAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjI0Ij5GaXRuZXNzIEFwcDwvdGV4dD4KPC9zdmc+",
                    tags: ["React Native", "Firebase", "Charts", "Health"],
                    dateAdded: new Date().toISOString()
                }
            ];

            this.projects = sampleProjects;
            this.saveProjects();
            this.renderProjects();
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ProjectManager();
});

// Add smooth scrolling for better UX
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Escape key closes modal
    if (e.key === 'Escape') {
        const modal = document.getElementById('addProjectModal');
        if (modal.style.display === 'block') {
            modal.style.display = 'none';
        }
    }
    
    // Ctrl/Cmd + K focuses search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('searchInput').focus();
    }
});