const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const USER_EMAIL = "rakeshngl@gmail.com";

async function run() {
  console.log(`Starting TickTick CSV import for ${USER_EMAIL}...`);
  
  // Find user
  const user = await prisma.user.findUnique({
    where: { email: USER_EMAIL },
  });

  if (!user) {
    console.error(`Error: User with email ${USER_EMAIL} not found!`);
    return;
  }

  const csvPath = path.resolve(__dirname, "../TickTick-backup-2026-06-07.csv");
  if (!fs.existsSync(csvPath)) {
    console.error(`Error: CSV file not found at ${csvPath}`);
    return;
  }

  const fileContent = fs.readFileSync(csvPath, "utf-8");
  const lines = fileContent.split(/\r?\n/);
  
  // Find header row
  let headerIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('"Folder Name"') || lines[i].startsWith("Folder Name")) {
      headerIndex = i;
      break;
    }
  }

  if (headerIndex === -1) {
    console.error("Error: Could not find header row in TickTick CSV!");
    return;
  }

  const headers = parseCsvLine(lines[headerIndex]);
  const rows = [];
  for (let i = headerIndex + 1; i < lines.length; i++) {
    if (lines[i].trim()) {
      rows.push(parseCsvLine(lines[i]));
    }
  }

  console.log(`Found ${rows.length} total tasks in backup. Importing...`);

  const getVal = (row, colName) => {
    const idx = headers.indexOf(colName);
    return idx !== -1 ? row[idx] : "";
  };

  let importedCount = 0;

  for (const row of rows) {
    const listName = getVal(row, "List Name") || "Inbox";
    const title = getVal(row, "Title");
    const content = getVal(row, "Content");
    const isChecklist = getVal(row, "Is Check list") === "Y";
    const dueDateStr = getVal(row, "Due Date");
    const priorityNum = getVal(row, "Priority");
    const statusNum = getVal(row, "Status");
    const columnName = getVal(row, "Column Name");
    const createdTimeStr = getVal(row, "Created Time");

    if (!title) continue;

    // 1. Get or Create Project
    let project = await prisma.project.findFirst({
      where: { name: listName, userId: user.id },
    });

    if (!project) {
      project = await prisma.project.create({
        data: { name: listName, userId: user.id },
      });
    }

    // 2. Get or Create Kanban Column
    let columnId = null;
    if (columnName) {
      let column = await prisma.taskColumn.findFirst({
        where: { name: columnName, projectId: project.id },
      });

      if (!column) {
        const lastCol = await prisma.taskColumn.findFirst({
          where: { projectId: project.id },
          orderBy: { position: "desc" },
        });
        const position = lastCol ? lastCol.position + 1000 : 1000;

        column = await prisma.taskColumn.create({
          data: {
            name: columnName,
            projectId: project.id,
            position,
          },
        });
      }
      columnId = column.id;
    }

    // 3. Map status and dates
    const isCompleted = statusNum === "1";
    const dueDate = dueDateStr ? new Date(dueDateStr) : null;
    const createdAt = createdTimeStr ? new Date(createdTimeStr) : new Date();

    let priority = "NONE";
    if (priorityNum === "1") priority = "LOW";
    if (priorityNum === "3") priority = "MEDIUM";
    if (priorityNum === "5") priority = "HIGH";

    // 4. Create Task
    const lastTask = await prisma.task.findFirst({
      where: { projectId: project.id },
      orderBy: { position: "desc" },
    });
    const taskPosition = lastTask ? lastTask.position + 1000 : 1000;

    const task = await prisma.task.create({
      data: {
        title,
        description: content || null,
        isCompleted,
        dueDate,
        priority,
        position: taskPosition,
        projectId: project.id,
        columnId,
        userId: user.id,
        createdAt,
      },
    });

    // 5. Parse and Create Subtasks
    if (isChecklist && content) {
      const items = content.split(/[▪▫]/);
      let pos = 1000;
      for (const item of items) {
        const cleaned = item.trim();
        if (!cleaned) continue;

        const originalIndex = content.indexOf(cleaned);
        const prefix = originalIndex > 0 ? content[originalIndex - 1] : "";
        const isSubCompleted = prefix === "▪";

        await prisma.subtask.create({
          data: {
            title: cleaned,
            isCompleted: isSubCompleted,
            position: pos,
            taskId: task.id,
          },
        });
        pos += 1000;
      }
    }

    importedCount++;
  }

  console.log(`Successfully imported ${importedCount} projects/tasks!`);
}

function parseCsvLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

run()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
