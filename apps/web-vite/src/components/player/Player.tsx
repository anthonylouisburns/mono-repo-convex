"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@packages/backend/convex/_generated/api";
import { Id } from "@packages/backend/convex/_generated/dataModel";
import { Howl } from "howler";
import { useEffect, useState, useCallback } from "react";
import { msToTime } from "../../lib/utilities";

export default function Player({ player_episode_id }: { player_episode_id: Id<"episode"> | undefined }) {
  const [sound, setSound] = useState<Howl>();
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [lastUpdatePos, setLastUpdatePos] = useState(0);

  const episodeName = useQuery(api.everwhz.episodeName, { id: player_episode_id });
  const { episode, podcast } = episodeName ?? {};
  const playStatus = useQuery(api.everwhz.getPlayStatus, { id: player_episode_id });
  const updatePlayStatus = useMutation(api.everwhz.playStatus);

  // Update time from server
  useEffect(() => {
    if (playStatus) {
      setCurrentTime(playStatus.position / 1000);
      setDuration(playStatus.duration ?? 0);
    }
  }, [playStatus]);

  // Cleanup sound on episode change
  useEffect(() => {
    if (sound) {
      sound.pause();
      sound.unload();
      setSound(undefined);
      setCurrentTime(0);
      setDuration(0);
    }
  }, [player_episode_id]);

  // Update progress
  useEffect(() => {
    if (!player_episode_id || !sound) return;

    const interval = setInterval(() => {
      const pos = sound.seek();
      setCurrentTime(Math.round(pos));
      setDuration(1000 * sound.duration());
      
      if (Math.abs(pos - lastUpdatePos) > 5) {
        updatePlayStatus({ id: player_episode_id, position: pos * 1000, duration });
        setLastUpdatePos(pos);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [sound, lastUpdatePos, player_episode_id, updatePlayStatus, duration]);

  const playSound = useCallback(() => {
    console.log("play sound", episode?.mp3_link, episode?._id);
    if (!episode?.mp3_link) return;
    if (sound?.playing()) return; // Prevent multiple plays

    if (!sound) {
      const newSound = new Howl({
        src: [episode.mp3_link],
        html5: true,
        onload: () => {
          if (playStatus?.position) {
            newSound.seek(playStatus.position / 1000);
          }
          newSound.play();
        }
      });
      setSound(newSound);
    } else {
      sound.play();
    }
  }, [episode?.mp3_link, sound, playStatus?.position]);

  return (
    <div className="header-center">
      <div>
        {podcast?.title}
        <div className="heavy" dangerouslySetInnerHTML={{ __html: episode?.title ?? "-" }} />
        <button className="navigation-button" onClick={playSound}>play</button>
        <button className="navigation-button" onClick={() => sound?.pause()}>stop</button>
        {msToTime(currentTime * 1000)} / {msToTime(duration)}
      </div>
    </div>
  );
}
