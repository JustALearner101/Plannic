import type { AgentActivityEvent } from '@plannic/core';
import { readProjectAgentActivity } from '../api/tauri.js';
import { projectStore } from './project.svelte.js';
import { plansStore } from './plans.svelte.js';
import { boardStore } from './board.svelte.js';

class AgentActivityStore {
  activeEvent = $state<AgentActivityEvent | null>(null);
  activeAgent = $state<string | null>(null);
  isAgentActive = $state<boolean>(false);
  statusMessage = $state<string>('');
  recentEvents = $state<AgentActivityEvent[]>([]);

  // Virtual cursor physical state
  cursorPosition = $state<{
    x: number;
    y: number;
    visible: boolean;
    action: string;
    agent: string;
    isDragging: boolean;
  }>({
    x: 200,
    y: 200,
    visible: false,
    action: '',
    agent: 'Antigravity',
    isDragging: false,
  });

  // Ripple effect target coordinates
  ripple = $state<{ x: number; y: number; active: boolean }>({
    x: 0,
    y: 0,
    active: false,
  });

  private pollInterval: ReturnType<typeof setInterval> | null = null;
  private lastProcessedEventId: string | null = null;

  init() {
    if (this.pollInterval) return;
    this.pollInterval = setInterval(async () => {
      await this.checkActivity();
    }, 450);
  }

  destroy() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  async checkActivity() {
    const cwd = projectStore.currentPath;
    if (!cwd) return;

    try {
      const stream = await readProjectAgentActivity(cwd);
      this.recentEvents = stream.events;

      if (stream.events.length === 0) {
        if (this.isAgentActive) {
          this.isAgentActive = false;
          this.activeAgent = null;
          this.cursorPosition.visible = false;
        }
        return;
      }

      const latestEvent = stream.events[stream.events.length - 1];
      if (latestEvent.id !== this.lastProcessedEventId) {
        this.lastProcessedEventId = latestEvent.id;
        await this.handleNewEvent(latestEvent);
      }
    } catch {
      // ignore
    }
  }

  private async handleNewEvent(event: AgentActivityEvent) {
    this.activeEvent = event;
    this.activeAgent = event.agent || 'Antigravity';

    if (event.status === 'executing') {
      this.isAgentActive = true;
      const targetName = event.taskTitle || event.phaseSlug || event.planSlug;
      this.statusMessage = `⚡ AI Agent [${this.activeAgent}]: ${event.action.replace(/_/g, ' ')} "${targetName}"...`;
      await this.animateAgentAction(event);
    } else if (event.status === 'completed') {
      this.statusMessage = `✓ AI Agent [${this.activeAgent}]: Completed ${event.action.replace(/_/g, ' ')}`;
      await this.animateAgentDrop(event);

      // Settle and reset active state after 1.2s
      setTimeout(async () => {
        this.isAgentActive = false;
        this.cursorPosition.visible = false;
        this.cursorPosition.isDragging = false;
        this.statusMessage = '';

        // Reload plans and board to guarantee UI sync
        const cwd = projectStore.currentPath;
        if (cwd) {
          await plansStore.loadPlans(cwd);
          if (plansStore.activePlan) {
            boardStore.loadTasksFromPlan(plansStore.activePlan);
          }
        }
      }, 1200);
    }
  }

  private async animateAgentAction(event: AgentActivityEvent) {
    if (typeof window === 'undefined') return;

    this.cursorPosition.agent = event.agent || 'Antigravity';
    this.cursorPosition.action = event.action;

    if (event.action === 'move_task' && event.taskTitle) {
      // Find card element in DOM
      const cardEl = document.querySelector(
        `[data-task-title*="${event.taskTitle.slice(0, 15)}"]`
      ) as HTMLElement | null;

      if (cardEl) {
        const rect = cardEl.getBoundingClientRect();
        // Glide cursor to card
        this.cursorPosition.x = rect.left + rect.width / 2;
        this.cursorPosition.y = rect.top + rect.height / 2;
        this.cursorPosition.visible = true;
        this.cursorPosition.isDragging = true;
        return;
      }
    }

    // Default cursor placement in top workspace area
    this.cursorPosition.x = Math.min(window.innerWidth * 0.65, window.innerWidth - 120);
    this.cursorPosition.y = 120;
    this.cursorPosition.visible = true;
    this.cursorPosition.isDragging = false;
  }

  private async animateAgentDrop(event: AgentActivityEvent) {
    if (typeof window === 'undefined') return;

    if (event.action === 'move_task' && event.toStatus) {
      const colEl = document.querySelector(
        `[data-column-id="${event.toStatus}"]`
      ) as HTMLElement | null;

      if (colEl) {
        const colRect = colEl.getBoundingClientRect();
        // Glide cursor to destination column
        this.cursorPosition.x = colRect.left + colRect.width / 2;
        this.cursorPosition.y = colRect.top + 140;
        this.cursorPosition.isDragging = false;

        // Trigger ripple effect
        this.triggerRipple(this.cursorPosition.x, this.cursorPosition.y);
        return;
      }
    }

    this.cursorPosition.isDragging = false;
  }

  triggerRipple(x: number, y: number) {
    this.ripple = { x, y, active: true };
    setTimeout(() => {
      this.ripple.active = false;
    }, 600);
  }
}

export const agentActivityStore = new AgentActivityStore();
