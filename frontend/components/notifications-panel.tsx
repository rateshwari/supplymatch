"use client";

import { useCallback, useEffect, useState } from "react";

import {
  getNotifications,
  markNotificationAsRead,
} from "@/lib/supplymatch-api";

import type { Notification } from "@/types/api";


function formatRelativeTime(
  dateString: string,
): string {

  const timestamp =
    new Date(dateString).getTime();

  const now = Date.now();

  const difference =
    Math.max(
      0,
      now - timestamp,
    );

  const minutes =
    Math.floor(
      difference / 60000,
    );

  if (minutes < 1) {
    return "Just now";
  }

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours =
    Math.floor(
      minutes / 60,
    );

  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days =
    Math.floor(
      hours / 24,
    );

  if (days < 7) {
    return `${days}d ago`;
  }

  return new Date(
    dateString,
  ).toLocaleDateString();
}


export default function NotificationsPanel() {

  const [
    notifications,
    setNotifications,
  ] = useState<Notification[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");


  const loadNotifications =
    useCallback(
      async () => {

        try {

          setError("");

          const data =
            await getNotifications();

          setNotifications(data);

        } catch (err) {

          setError(
            err instanceof Error
              ? err.message
              : "Unable to load notifications.",
          );

        } finally {

          setLoading(false);

        }

      },
      [],
    );


  useEffect(() => {

    loadNotifications();

    /*
     * Refresh every 5 seconds.
     *
     * This means the supplier does not need
     * to manually refresh the page after the
     * client sends a match request.
     */
    const interval =
      window.setInterval(
        loadNotifications,
        5000,
      );

    return () => {
      window.clearInterval(interval);
    };

  }, [loadNotifications]);


  async function handleMarkAsRead(
    notificationId: string,
  ) {

    try {

      const updated =
        await markNotificationAsRead(
          notificationId,
        );

      setNotifications(
        (current) =>
          current.map(
            (notification) =>
              notification.id ===
              updated.id
                ? updated
                : notification,
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


  const unreadCount =
    notifications.filter(
      (notification) =>
        !notification.read,
    ).length;


  return (

    <section className="border border-[#aeb4ad] bg-[#f8f5ec]">

      <div className="flex items-center justify-between border-b border-[#d0d3cc] px-6 py-5">

        <div>

          <p className="font-mono text-[8px] font-semibold uppercase tracking-[0.18em] text-[#7c827b]">
            Activity Registry
          </p>

          <div className="mt-2 flex items-center gap-3">

            <h2 className="font-serif text-2xl text-[#18221e]">
              Notifications
            </h2>

            {unreadCount > 0 && (

              <span className="border border-[#26312c] bg-[#26312c] px-2.5 py-1 font-mono text-[8px] font-semibold uppercase tracking-[0.12em] text-[#f4f0e5]">
                {unreadCount} new
              </span>

            )}

          </div>

        </div>


        <button
          type="button"
          onClick={loadNotifications}
          className="border border-[#aeb4ad] px-4 py-2 font-mono text-[8px] font-semibold uppercase tracking-[0.14em] text-[#526059] transition hover:bg-[#eef0ea]"
        >
          Refresh
        </button>

      </div>


      {loading && (

        <div className="px-6 py-10 text-center">

          <p className="font-mono text-[9px] uppercase tracking-[0.17em] text-[#7b857e]">
            Loading notifications...
          </p>

        </div>

      )}


      {!loading && error && (

        <div className="border-b border-[#d0d3cc] bg-[#f6e9e3] px-6 py-5">

          <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#a63e27]">
            {error}
          </p>

        </div>

      )}


      {!loading &&
        !error &&
        notifications.length === 0 && (

          <div className="px-6 py-14 text-center">

            <p className="font-serif text-xl text-[#26312c]">
              No notifications yet
            </p>

            <p className="mt-2 font-serif text-sm text-[#747d76]">
              New supplier requests and match updates will appear here.
            </p>

          </div>

        )}


      {!loading &&
        notifications.length > 0 && (

          <div className="divide-y divide-[#d0d3cc]">

            {notifications.map(
              (notification) => (

                <div
                  key={notification.id}
                  className={`px-6 py-5 transition ${
                    notification.read
                      ? "bg-[#f8f5ec]"
                      : "bg-[#eef0ea]"
                  }`}
                >

                  <div className="flex gap-4">

                    <div className="pt-2">

                      <span
                        className={`block h-2.5 w-2.5 rounded-full ${
                          notification.read
                            ? "bg-[#c9cec8]"
                            : "bg-[#26312c]"
                        }`}
                      />

                    </div>


                    <div className="min-w-0 flex-1">

                      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">

                        <p
                          className={`font-serif text-[15px] leading-6 ${
                            notification.read
                              ? "text-[#68716a]"
                              : "font-semibold text-[#26312c]"
                          }`}
                        >
                          {notification.message}
                        </p>


                        <span className="shrink-0 font-mono text-[8px] uppercase tracking-[0.12em] text-[#8a918c]">
                          {formatRelativeTime(
                            notification.created_at,
                          )}
                        </span>

                      </div>


                      {!notification.read && (

                        <button
                          type="button"
                          onClick={() =>
                            handleMarkAsRead(
                              notification.id,
                            )
                          }
                          className="mt-3 font-mono text-[8px] font-semibold uppercase tracking-[0.14em] text-[#526059] transition hover:text-[#18221e]"
                        >
                          Mark as read
                        </button>

                      )}

                    </div>

                  </div>

                </div>

              ),
            )}

          </div>

        )}

    </section>
  );
}