"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { treemap, hierarchy } from "d3-hierarchy";

export type TreemapNode = {
  artist_id: string;
  artist_name: string;
  artist_image: string | null;
  play_count: number;
  estimated_payout: number;
  gradientStart: string | null;
  gradientEnd: string | null;
  rank: number;
  x: number;
  y: number;
  width: number;
  height: number;
};

type ArtistData = {
  artist_id: string;
  artist_name: string;
  artist_image: string | null;
  play_count: number;
  estimated_payout: number;
  gradientStart: string | null;
  gradientEnd: string | null;
};

type HierarchyChild = ArtistData & {
  name: string;
  value: number;
  rank: number;
};

/**
 * Hook that calculates treemap layout for artist data
 * Returns positioned rectangles with dimensions for each artist
 */
export function useTreemapLayout(
  artists: ArtistData[],
  containerWidth: number,
  containerHeight: number
): TreemapNode[] {
  const nodes = useMemo(() => {
    if (artists.length === 0 || containerWidth === 0 || containerHeight === 0) {
      return [];
    }

    // Create hierarchy data structure
    const hierarchyData = {
      name: "root",
      children: artists.map((artist, index) => ({
        ...artist,
        name: artist.artist_name,
        value: artist.play_count,
        rank: index + 1,
      })),
    };

    // Create treemap layout
    const root = hierarchy(hierarchyData)
      .sum((d) => (d as unknown as HierarchyChild).value || 0)
      .sort((a, b) => ((b.value || 0) as number) - ((a.value || 0) as number));

    const treemapLayout = treemap<typeof hierarchyData>()
      .size([containerWidth, containerHeight])
      .padding(4)
      .round(true);

    treemapLayout(root);

    // Extract positioned nodes
    const layoutNodes: TreemapNode[] = [];
    root.children?.forEach((node) => {
      const data = node.data as unknown as HierarchyChild;
      // Treemap adds x0, y0, x1, y1 properties to nodes
      const treemapNode = node as typeof node & { x0: number; y0: number; x1: number; y1: number };
      layoutNodes.push({
        artist_id: data.artist_id,
        artist_name: data.artist_name,
        artist_image: data.artist_image,
        play_count: data.play_count,
        estimated_payout: data.estimated_payout,
        gradientStart: data.gradientStart,
        gradientEnd: data.gradientEnd,
        rank: data.rank,
        x: treemapNode.x0,
        y: treemapNode.y0,
        width: treemapNode.x1 - treemapNode.x0,
        height: treemapNode.y1 - treemapNode.y0,
      });
    });

    return layoutNodes;
  }, [artists, containerWidth, containerHeight]);

  return nodes;
}

/**
 * Hook to measure container dimensions
 */
export function useContainerDimensions() {
  const ref = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateDimensions = () => {
      if (ref.current) {
        setDimensions({
          width: ref.current.offsetWidth,
          height: ref.current.offsetHeight,
        });
      }
    };

    updateDimensions();

    const observer = new ResizeObserver(updateDimensions);
    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return { ref, dimensions };
}

