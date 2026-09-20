import { api } from "./api";
import type {
  CreateOfferingRequest,
  CreateRequirementRequest,
  Match,
  Notification,
  Offering,
  Requirement,
} from "../types/api";

export function createRequirement(
  payload: CreateRequirementRequest,
): Promise<Requirement> {
  return api.post<Requirement>(
    "/api/v1/requirements",
    payload,
  );
}

export function getRequirements(): Promise<Requirement[]> {
  return api.get<Requirement[]>("/api/v1/requirements");
}

export function createOffering(
  payload: CreateOfferingRequest,
): Promise<Offering> {
  return api.post<Offering>(
    "/api/v1/offerings",
    payload,
  );
}

export function getOfferings(): Promise<Offering[]> {
  return api.get<Offering[]>("/api/v1/offerings");
}

export function generateMatches(
  requirementId: string,
): Promise<Match[]> {
  return api.post<Match[]>(
    `/api/v1/requirements/${requirementId}/matches`,
    {},
  );
}

export function getRequirementMatches(
  requirementId: string,
): Promise<Match[]> {
  return api.get<Match[]>(
    `/api/v1/requirements/${requirementId}/matches`,
  );
}

export function getNotifications(): Promise<Notification[]> {
  return api.get<Notification[]>("/api/v1/notifications");
}

export function markNotificationAsRead(
  notificationId: string,
): Promise<Notification> {
  return api.patch<Notification>(
    `/api/v1/notifications/${notificationId}/read`,
    {},
  );
}