export interface QuestAnnouncement {
  id: string;
  title: string;
  rewardStars: number;
  submissionType: string;
}

export async function announceQuestLive(quest: QuestAnnouncement): Promise<boolean> {
  const embed = {
    title: `📣 New quest is live: ${quest.title}`,
    description: `${quest.rewardStars} ⭐ · ${quest.submissionType} submission`,
    color: 0x57f287,
    ...(questUrl(quest.id) ? { url: questUrl(quest.id) } : {}),
  };
  return postWebhook(embed);
}

export async function announceQuestClosed(quest: QuestAnnouncement): Promise<boolean> {
  const embed = {
    title: `🔒 Quest ended: ${quest.title}`,
    description: "Submissions for this quest are now closed.",
    color: 0xe67e22,
    ...(questUrl(quest.id) ? { url: questUrl(quest.id) } : {}),
  };
  return postWebhook(embed);
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
