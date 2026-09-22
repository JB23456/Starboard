export interface QuestAnnouncement {
  id: string;
  title: string;
  description: string;
  rewardStars: number;
}

const EMBED_DESCRIPTION_LIMIT = 4096;

export async function announceQuestLive(quest: QuestAnnouncement): Promise<boolean> {
  const url = questUrl(quest.id);
  const nameLine = url ? `[**${quest.title}**](${url})` : `**${quest.title}**`;
  const embed = {
    author: { name: "📣 New Quest" },
    description: [nameLine, truncate(quest.description, 4000), `⭐ ${quest.rewardStars} stars`]
      .filter(Boolean)
      .join("\n\n"),
    color: 0x57f287,
  };
  return postWebhook(embed);
}

export async function announceQuestClosed(quest: QuestAnnouncement): Promise<boolean> {
  const embed = {
    title: `🔒 Quest Ended: ${quest.title}`,
    description: "Submissions for this quest are now closed.",
    color: 0xe67e22,
  };
  return postWebhook(embed);
}

function truncate(text: string, max: number): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max)}…`;
}

function questUrl(id: string): string | undefined {
  const base = process.env.PUBLIC_APP_URL;
  if (!base) return undefined;
  return `${base.replace(/\/$/, "")}/quests/${id}`;
}

async function postWebhook(embed: Record<string, unknown>): Promise<boolean> {
  const webhookUrl = process.env.DISCORD_QUEST_WEBHOOK_URL;
  if (!webhookUrl) return false;
  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "Starboard", embeds: [embed] }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      console.error("Discord webhook failed with status", res.status);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Discord webhook error:", error);
    return false;
  }
}
