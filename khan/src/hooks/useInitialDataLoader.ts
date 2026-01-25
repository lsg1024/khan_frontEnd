import { useState, useEffect, useCallback } from "react";
import { materialApi } from "../../libs/api/materialApi";
import { colorApi } from "../../libs/api/colorApi";
import { assistantStoneApi } from "../../libs/api/assistantStoneApi";
import { priorityApi } from "../../libs/api/priorityApi";
import { goldHarryApi } from "../../libs/api/goldHarryApi";
import type { MaterialDto } from "../types/materialDto";
import type { ColorDto } from "../types/colorDto";
import type { AssistantStoneDto } from "../types/AssistantStoneDto";

export interface PriorityDto {
	priorityName: string;
	priorityDate: number;
}

export interface GoldHarryDto {
	goldHarryId: string;
	goldHarry: number;
}

interface UseInitialDataLoaderOptions {
	loadPriorities?: boolean;
	loadGoldHarries?: boolean;
}

interface UseInitialDataLoaderResult {
	materials: MaterialDto[];
	colors: ColorDto[];
	assistantStones: AssistantStoneDto[];
	priorities: PriorityDto[];
	goldHarries: GoldHarryDto[];
	loading: boolean;
	error: Error | null;
	reload: () => Promise<void>;
}

export function useInitialDataLoader(
	options: UseInitialDataLoaderOptions = {}
): UseInitialDataLoaderResult {
	const { loadPriorities = false, loadGoldHarries = false } = options;

	const [materials, setMaterials] = useState<MaterialDto[]>([]);
	const [colors, setColors] = useState<ColorDto[]>([]);
	const [assistantStones, setAssistantStones] = useState<AssistantStoneDto[]>(
		[]
	);
	const [priorities, setPriorities] = useState<PriorityDto[]>([]);
	const [goldHarries, setGoldHarries] = useState<GoldHarryDto[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<Error | null>(null);

	const loadData = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);

			const promises: Promise<unknown>[] = [
				materialApi.getMaterials(),
				colorApi.getColors(),
				assistantStoneApi.getAssistantStones(),
			];

			if (loadPriorities) {
				promises.push(priorityApi.getPriorities());
			}

			if (loadGoldHarries) {
				promises.push(goldHarryApi.getGoldHarry());
			}

			const results = await Promise.all(promises);

			// Materials
			const materialRes = results[0] as { success: boolean; data?: unknown[] };
			if (materialRes.success) {
				const loadedMaterials = (materialRes.data || []).map(
					(m: Record<string, unknown>) => ({
						materialId: m.materialId?.toString() || "",
						materialName: m.materialName as string,
						materialGoldPurityPercent:
							(m.materialGoldPurityPercent as string) || "",
					})
				);
				setMaterials(loadedMaterials);
			}

			// Colors
			const colorRes = results[1] as { success: boolean; data?: unknown[] };
			if (colorRes.success) {
				const loadedColors = (colorRes.data || []).map(
					(c: Record<string, unknown>) => ({
						colorId: (c.colorId as string) || "",
						colorName: c.colorName as string,
						colorNote: (c.colorNote as string) || "",
					})
				);
				setColors(loadedColors);
			}

			// Assistant Stones
			const assistantStoneRes = results[2] as {
				success: boolean;
				data?: unknown[];
			};
			if (assistantStoneRes.success) {
				const loadedAssistantStones = (assistantStoneRes.data || []).map(
					(a: Record<string, unknown>) => ({
						assistantStoneId: a.assistantStoneId as number,
						assistantStoneName: a.assistantStoneName as string,
					})
				);
				setAssistantStones(loadedAssistantStones);
			}

			// Priorities (optional)
			if (loadPriorities && results[3]) {
				const priorityRes = results[3] as { success: boolean; data?: unknown[] };
				if (priorityRes.success) {
					const loadedPriorities = (priorityRes.data || []).map(
						(p: Record<string, unknown>) => ({
							priorityName: p.priorityName as string,
							priorityDate: p.priorityDate as number,
						})
					);
					setPriorities(loadedPriorities);
				}
			}

			// Gold Harries (optional)
			const goldHarryIndex = loadPriorities ? 4 : 3;
			if (loadGoldHarries && results[goldHarryIndex]) {
				const goldHarryRes = results[goldHarryIndex] as {
					success: boolean;
					data?: unknown[];
				};
				if (goldHarryRes.success) {
					const loadedGoldHarries = (goldHarryRes.data || []).map(
						(g: Record<string, unknown>) => ({
							goldHarryId: g.goldHarryId?.toString() || "",
							goldHarry: g.goldHarry as number,
						})
					);
					setGoldHarries(loadedGoldHarries);
				}
			}
		} catch (err) {
			setError(err instanceof Error ? err : new Error(String(err)));
		} finally {
			setLoading(false);
		}
	}, [loadPriorities, loadGoldHarries]);

	useEffect(() => {
		loadData();
	}, [loadData]);

	return {
		materials,
		colors,
		assistantStones,
		priorities,
		goldHarries,
		loading,
		error,
		reload: loadData,
	};
}
