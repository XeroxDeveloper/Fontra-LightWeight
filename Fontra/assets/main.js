const app = {
    el: {
        editor: document.getElementById('editor'),
        gutter: document.getElementById('gutter'),
        splash: document.getElementById('splash-screen'),
        setup: document.getElementById('setup-overlay'),
        preview: document.getElementById('preview-box'),
        frame: document.getElementById('preview-frame'),
        toast: document.getElementById('toast'),
        file: document.getElementById('file-in'),
        offline: document.getElementById('offline-screen')
    },

    init() {
        const savedTheme = localStorage.getItem('fontra_theme') || 'red';
        const savedCode = localStorage.getItem('fontra_code') || '';
        const isFirstRun = !localStorage.getItem('fontra_done');

        // 1. Тема и Код
        this.setTheme(savedTheme);
        this.el.editor.value = savedCode;
        this.updateLines();

        // 2. Проверка интернета при запуске
        if (!navigator.onLine) {
            this.toggleOffline(true);
        }

        // 3. Splash
        setTimeout(() => {
            this.el.splash.classList.add('splash-hidden');
            if (isFirstRun) setTimeout(() => this.openSetup(), 300);
        }, 1500);

        this.bindEvents();
    },

    bindEvents() {
        // Слушатели сети
        window.addEventListener('offline', () => this.toggleOffline(true));
        window.addEventListener('online', () => this.toggleOffline(false));

        // Скролл
        this.el.editor.addEventListener('scroll', () => {
            this.el.gutter.scrollTop = this.el.editor.scrollTop;
        });

        // Ввод
        this.el.editor.addEventListener('input', () => {
            this.updateLines();
            localStorage.setItem('fontra_code', this.el.editor.value);
        });

        // Tab
        this.el.editor.addEventListener('keydown', (e) => {
            if(e.key === 'Tab') {
                e.preventDefault();
                document.execCommand('insertText', false, '  ');
            }
        });

        // Файл
        this.el.file.addEventListener('change', (e) => {
            const f = e.target.files[0];
            if(!f) return;
            const r = new FileReader();
            r.onload = (ev) => {
                this.el.editor.value = ev.target.result;
                this.updateLines();
                this.toast('Файл открыт');
            };
            r.readAsText(f);
        });
    },

    toggleOffline(isOffline) {
        if (isOffline) {
            this.el.offline.classList.remove('offline-hidden');
        } else {
            this.el.offline.classList.add('offline-hidden');
        }
    },

    updateLines() {
        const lines = this.el.editor.value.split('\n').length;
        this.el.gutter.innerText = Array(lines).fill(0).map((_, i) => i + 1).join('\n');
    },

    setTheme(name) {
        document.documentElement.setAttribute('data-theme', name);
        localStorage.setItem('fontra_theme', name);
        
        const colors = { red: '#b91823', dark: '#141212', white: '#6750a4', gray: '#616161' };
        document.querySelector('meta[name="theme-color"]').content = colors[name];

        document.querySelectorAll('.theme-opt').forEach(o => o.classList.remove('selected'));
        const active = document.getElementById(`th-${name}`);
        if(active) active.classList.add('selected');
    },

    openSetup() { this.el.setup.classList.add('show'); },
    closeSetup() { 
        this.el.setup.classList.remove('show'); 
        localStorage.setItem('fontra_done', 'true');
    },

    togglePreview() {
        const isShow = this.el.preview.style.display === 'flex';
        if(!isShow) {
            let code = this.el.editor.value;
            if(!code.trim().startsWith('<')) {
                code = code.replace(/^# (.*$)/gim, '<h1>$1</h1>')
                           .replace(/\*\*(.*)\*\*/gim, '<b>$1</b>')
                           .replace(/\n/gim, '<br>');
                code = `<style>body{font-family:sans-serif;padding:15px}</style>${code}`;
            }
            this.el.frame.srcdoc = code;
            this.el.preview.style.display = 'flex';
        } else {
            this.el.preview.style.display = 'none';
            this.el.frame.srcdoc = '';
        }
    },

    saveFile() {
        const b = new Blob([this.el.editor.value], {type:'text/html'});
        const a = document.createElement('a');
        a.href = URL.createObjectURL(b);
        a.download = `fontra_${Date.now()}.html`;
        a.click();
        this.toast('Сохранено');
    },

    toast(msg) {
        this.el.toast.innerText = msg;
        this.el.toast.style.opacity = 1;
        setTimeout(() => this.el.toast.style.opacity = 0, 2000);
    }
};

window.onload = () => app.init();