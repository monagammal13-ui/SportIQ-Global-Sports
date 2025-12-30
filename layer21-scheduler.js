/**
 * Layer 21: Content Scheduler & Publishing Queue Runtime
 */
class ContentSchedulerRuntime {
    constructor() {
        if (window.__ANTIGRAVITY_SCHEDULER__) return window.__ANTIGRAVITY_SCHEDULER__;
        this.version = '1.0.0';
        this.scheduledItems = [];
        this.queue = [];
        this._init();
    }

    async _init() {
        this._loadSchedule();
        this._startScheduler();
    }

    schedule(article, publishDate) {
        this.scheduledItems.push({
            id: `sch_${Date.now()}`,
            article,
            publishDate: new Date(publishDate).getTime(),
            status: 'scheduled'
        });
        this._save();
        return true;
    }

    _startScheduler() {
        setInterval(() => {
            const now = Date.now();
            this.scheduledItems.forEach(item => {
                if (item.status === 'scheduled' && item.publishDate <= now) {
                    this._publish(item);
                }
            });
        }, 60000); // Check every minute
    }

    _publish(item) {
        if (window.__ANTIGRAVITY_CMS__) {
            window.__ANTIGRAVITY_CMS__.updateArticle(item.article.id, { status: 'published' });
            item.status = 'published';
            this._save();
        }
    }

    _loadSchedule() {
        const saved = localStorage.getItem('scheduled_content');
        if (saved) this.scheduledItems = JSON.parse(saved);
    }

    _save() {
        localStorage.setItem('scheduled_content', JSON.stringify(this.scheduledItems));
    }

    getScheduled() { return this.scheduledItems.filter(i => i.status === 'scheduled'); }
}

window.__ANTIGRAVITY_SCHEDULER__ = new ContentSchedulerRuntime();
export default window.__ANTIGRAVITY_SCHEDULER__;
