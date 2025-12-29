import prisma from "../configs/prisma.js";

// get all workspaces for user
export const getUserWorkspaces = async (req, res) => {
  try {
    const { userId } = await req.auth();
    const workspaces = await prisma.workspace.findMany({
      where: {
        members: { some: { userId: userId } },
        include: {
          members: { include: { user: true } },
          projects: {
            include: {
              tasks: {
                include: {
                  assignee: true,
                  comments: { include: { user: true } },
                },
              },
              members: { include: { user: true } },
            },
          },
          owner: true,
        },
      },
    });
    res.json({ workspaces });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.code || error.message });
  }
};

// add member to workspace
export const addMember = async (req, res) => {
  try {
    const { userId } = await req.auth();
    const { email, role, workspaceId, message } = req.body;
    const user = await prisma.user.findUnique({ where: email });
    if (!user) {
      return res.status(404).json({ message: "user not found" });
    }

    if (!workspaceId || !role) {
      return res.status(400).json({ message: "missing required parameters" });
    }

    if (!["ADMIN", "MEMBER"].includes(role)) {
      return res.status(400).json({ message: "invalid role" });
    }
    // fetch work space
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: { members: true },
    });

    if (!workspace) {
      return res.status(404).json({ message: "work space not found" });
    }

    // check creator has admin role

    if (
      !workspace.members.find(
        (member) => member.userId === userId && member.role === "ADMIN"
      )
    ) {
      return res
        .status(401)
        .json({ message: "you do not have admin privilages" });
    }
    //  check user is already a memmber
    const existingMember = workspace.members.find(
      (member) => member.userId === userId
    );

    if (existingMember) {
      return res.status(400).json({ message: "user is already a member " });
    }

    const member = await prisma.workspaceMember.create({
      data: {
        userId: user.id,
        workspace,
        role,
        message,
      },
    });

    return res
      .status(400)
      .json({ member, message: "member added successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.code || error.message });
  }
};
