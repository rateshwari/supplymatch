import { api } from "./api";

import type {
  CreateOfferingRequest,
  CreateProfileRequest,
  CreateRequirementRequest,
  Match,
  Notification,
  Offering,
  Profile,
  Requirement,
  SupplierMatch,
  UpdateProfileRequest,
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
  return api.get<Requirement[]>(
    "/api/v1/requirements",
  );
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
  return api.get<Offering[]>(
    "/api/v1/offerings",
  );
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


/**
 * Client sends a selected supplier match request.
 */
export function requestMatch(
  matchId: string,
): Promise<Match> {
  return api.patch<Match>(
    `/api/v1/requirements/match/${matchId}/request`,
    {},
  );
}


/**
 * Supplier accepts a client match request.
 */
export function acceptMatch(
  matchId: string,
): Promise<Match> {
  return api.patch<Match>(
    `/api/v1/requirements/match/${matchId}/accept`,
    {},
  );
}


export function getNotifications(): Promise<Notification[]> {
  return api.get<Notification[]>(
    "/api/v1/notifications",
  );
}


export function markNotificationAsRead(
  notificationId: string,
): Promise<Notification> {
  return api.patch<Notification>(
    `/api/v1/notifications/${notificationId}/read`,
    {},
  );
}


export function createProfile(
  payload: CreateProfileRequest,
): Promise<Profile> {
  return api.post<Profile>(
    "/api/v1/profile/me",
    payload,
  );
}


export function getMyProfile(): Promise<Profile> {
  return api.get<Profile>(
    "/api/v1/profile/me",
  );
}


export function updateMyProfile(
  payload: UpdateProfileRequest,
): Promise<Profile> {
  return api.patch<Profile>(
    "/api/v1/profile/me",
    payload,
  );
}


export function getSupplierMatches(): Promise<SupplierMatch[]> {
  return api.get<SupplierMatch[]>(
    "/api/v1/supplier/matches",
  );
}