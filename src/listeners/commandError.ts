import { ApplicationCommandMessage } from "@fire/lib/extensions/appcommandmessage";
import { ContextCommandMessage } from "@fire/lib/extensions/contextcommandmessage";
import { FireMessage } from "@fire/lib/extensions/message";
import { BaseFakeChannel } from "@fire/lib/interfaces/misc";
import { Command, InvalidArgumentContextError } from "@fire/lib/util/command";
import { constants } from "@fire/lib/util/constants";
import { Listener } from "@fire/lib/util/listener";
import { DMChannel, GuildChannel, ThreadChannel } from "discord.js";

const { emojis } = constants;

export default class CommandError extends Listener {
  constructor() {
    super("commandError", {
      emitter: "commandHandler",
      event: "commandError",
    });
  }

  async exec(
    message: FireMessage,
    command: Command,
    args: Record<string, unknown>,
    error: Error
  ) {
    if (error instanceof InvalidArgumentContextError)
      return await message.error("COMMAND_ERROR_INVALID_ARGUMENT", {
        arg: error.argument,
      });

    const point = {
      measurement: "commands",
      tags: {
        type: "error",
        command: command.id,
        cluster: this.client.manager.id.toString(),
        shard: message.shard.id.toString(),
        user_id: message.author.id, // easier to query tag
      },
      fields: {
        type: "error",
        command: command.id,
        // TODO: possibly rename to "source" rather than guild?
        guild: message.source,
        user: `${message.author} (${message.author.id})`,
        message_id: message.id,
        error: "",
        sentry: "",
      },
    };
    try {
      point.fields.error = error.message;
    } catch {}

    if (typeof this.client.sentry != "undefined") {
      const sentry = this.client.sentry;
      sentry.setUser({
        id: message.author.id,
        username: message.author.toString(),
      });
      const extras = {
        "message.id": message.id,
        "guild.id": message.guildId,
        "source.name": message.source,
        "source.shard": message.shard.id,
        "channel.id": message.channel?.id || "0",
        "channel.name": this.getChannelName(message.channel) || "Unknown",
        "command.name": command.id,
        env: process.env.NODE_ENV,
      };
      try {
        // sometimes leads to circular structure error
        extras["command.args"] = JSON.stringify(args);
      } catch {}
      sentry.setExtras(extras);
      const eventId = sentry.captureException(error);
      if (eventId) point.fields.sentry = eventId;
      sentry.setExtras(null);
      sentry.setUser(null);
    }
    this.client.writeToInflux([point]);

    if (message.channel instanceof ThreadChannel) {
      const checks = await this.client.commandHandler
        .preThreadChecks(message)
        .catch(() => {});
      if (!checks) return;
    }

    try {
      if (!message.author.isSuperuser()) {
        return await message.error("COMMAND_ERROR_GENERIC", {
          id: message?.util?.parsed?.alias ?? command.id,
        });
      } else {
        return await message.channel.send("```js\n" + error.stack + "```");
      }
    } catch {}
  }

  getChannelName(
    channel: GuildChannel | ThreadChannel | BaseFakeChannel | DMChannel
  ) {
    if (channel instanceof DMChannel) return channel.recipient?.toString();
    else return channel?.name;
  }
}
