-- CreateTable
CREATE TABLE "NotificationType" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_NotificationToNotificationType" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_NotificationToNotificationType_A_fkey" FOREIGN KEY ("A") REFERENCES "Notification" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_NotificationToNotificationType_B_fkey" FOREIGN KEY ("B") REFERENCES "NotificationType" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "_NotificationToNotificationType_AB_unique" ON "_NotificationToNotificationType"("A", "B");

-- CreateIndex
CREATE INDEX "_NotificationToNotificationType_B_index" ON "_NotificationToNotificationType"("B");
