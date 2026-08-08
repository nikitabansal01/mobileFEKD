import { Image, type ImageProps, type ImageSource } from "expo-image";
import React, { useEffect, useState } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import type { PlanImageDto } from "@/src/core/api/contracts";

const DEFAULT_FALLBACK_SOURCE = require("@/assets/Home/dish.png");

export type ResolvedPlanImage =
  | { kind: "remote"; source: ImageSource }
  | { kind: "fallback"; source: ImageSource | number };

export function resolvePlanImageSource(
  image: Pick<PlanImageDto, "public_url"> | null | undefined,
  failed: boolean,
  fallbackSource: ImageSource | number = DEFAULT_FALLBACK_SOURCE,
): ResolvedPlanImage {
  const url = image?.public_url.trim();
  if (failed || !url || !/^https:\/\//i.test(url)) {
    return { kind: "fallback", source: fallbackSource };
  }
  return { kind: "remote", source: { uri: url } };
}

export interface PlanImageProps extends Omit<
  ImageProps,
  "source" | "placeholder" | "onError" | "accessibilityLabel"
> {
  image: PlanImageDto | null | undefined;
  fallbackSource?: ImageSource | number;
  containerStyle?: StyleProp<ViewStyle>;
  onLoadFailure?: () => void;
}

/** Shared expo-image prefetch path used before a canonical plan is revealed. */
export async function prefetchPlanImageUrls(
  urls: readonly string[],
): Promise<void> {
  const results = await Promise.all(urls.map((url) => Image.prefetch(url)));
  if (results.some((result) => !result)) {
    throw new Error("Plan images could not be prepared for display.");
  }
}

/**
 * The only plan-image renderer. It uses disk/memory caching and guarantees a
 * visible local fallback if an unexpected CDN failure escapes backend gates.
 */
export function PlanImage({
  image,
  fallbackSource = DEFAULT_FALLBACK_SOURCE,
  containerStyle,
  onLoadFailure,
  ...imageProps
}: PlanImageProps) {
  const [failed, setFailed] = useState(false);
  const remoteUrl = image?.public_url.trim();
  const isRemoteUrl = Boolean(remoteUrl && /^https:\/\//i.test(remoteUrl));

  const [prefetched, setPrefetched] = useState(false);
  useEffect(() => {
    let active = true;
    setFailed(false);
    setPrefetched(false);
    if (!isRemoteUrl || !remoteUrl) {
      setPrefetched(true);
      return () => {
        active = false;
      };
    }
    void Image.prefetch(remoteUrl).then(
      () => active && setPrefetched(true),
      () => {
        if (!active) return;
        setFailed(true);
        onLoadFailure?.();
      },
    );
    return () => {
      active = false;
    };
  }, [fallbackSource, image?.asset_id, isRemoteUrl, onLoadFailure, remoteUrl]);

  const resolved = resolvePlanImageSource(image, failed, fallbackSource);

  return (
    <View style={[styles.container, containerStyle]}>
      {prefetched && (
        <Image
          {...imageProps}
          source={resolved.source}
          accessibilityLabel={image?.alt_text || "AUVRA wellness activity"}
          cachePolicy="memory-disk"
          contentFit={imageProps.contentFit ?? "cover"}
          transition={imageProps.transition ?? 180}
          onError={() => {
            if (resolved.kind === "remote") {
              setFailed(true);
              onLoadFailure?.();
            }
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    backgroundColor: "#F4EDF1",
  },
});
