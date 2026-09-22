"use client";

import { useEffect, useState } from "react";

import {
  getNotifications,
  markNotificationAsRead,
} from "@/lib/supplymatch-api";
import type { Notification } from "@/types/api";

function formatRelativeTime(dateString: string): string {
  const timestamp = new Date(dateString).getTime();
  const now = Date.now();
  const difference = Math.max(0, now - timestamp);

  const minutes = Math.floor(difference / 60000);

  if (minutes < 1) {
    return "Just now";
  }

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);

  if (days < 7) {
    return `${days}d ago`;
  }

  return new Date(dateString).toLocaleDateString();
}

export default function NotificationsPanel() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadNotifications() {
      try {
        setLoading(true);
        setError("");

        const data = await getNotifications();

        if (active) {
          setNotifications(data);
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load notifications.",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadNotifications();

    return () => {
      active = false;
    };
  }, []);

  async function handleMarkAsRead(notificationId: string) {
    try {
      const updated = await markNotificationAsRead(notificationId);

      setNotifications((current) =>
        current.map((notification) =>
          notification.id === updated.id ? updated : notification,
        ),
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update notification.",
      );
    }
  }

  const unreadCount = notifications.filter(
    (notification) => !notification.read,
  ).length;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Activity
          </p>

          <div className="mt-1 flex items-center gap-3">
            <h2 className="text-lg font-semibold text-slate-950">
              Notifications
            </h2>

            {unreadCount > 0 && (
              <span className="rounded-full bg-slate-950 px-2.5 py-1 text-xs font-semibold text-white">
                {unreadCount} new
              </span>
            )}
          </div>
        </div>
      </div>

      {loading && (
        <div className="px-6 py-8 text-sm text-slate-500">
          Loading notifications...
        </div>
      )}

      {!loading && error && (
        <div className="px-6 py-6">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {!loading && !error && notifications.length === 0 && (
        <div className="px-6 py-10 text-center">
          <p className="text-sm font-medium text-slate-700">
            No notifications yet
          </p>

          <p className="mt-1 text-sm text-slate-500">
            New supplier matches will appear here.
          </p>
        </div>
      )}

      {!loading && notifications.length > 0 && (
        <div className="divide-y divide-slate-100">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`px-6 py-5 transition ${
                notification.read ? "bg-white" : "bg-slate-50/80"
              }`}
            >
              <div className="flex gap-4">
                <div className="pt-1">
                  <span
                    className={`block h-2.5 w-2.5 rounded-full ${
                      notification.read
                        ? "bg-slate-200"
                        : "bg-slate-950"
                    }`}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                    <p
                      className={`text-sm leading-6 ${
                        notification.read
                          ? "text-slate-600"
                          : "font-medium text-slate-900"
                      }`}
                    >
                      {notification.message}
                    </p>

                    <span className="shrink-0 text-xs text-slate-400">
                      {formatRelativeTime(notification.created_at)}
                    </span>
                  </div>

                  {!notification.read && (
                    <button
                      type="button"
                      onClick={() =>
                        handleMarkAsRead(notification.id)
                      }
                      className="mt-3 text-xs font-semibold text-slate-700 transition hover:text-slate-950"
                    >
                      Mark as read
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}