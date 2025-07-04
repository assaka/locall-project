import { NextRequest, NextResponse } from 'next/server';
import { UserManagementService } from '../../../lib/user-management-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');
    const userId = searchParams.get('userId');
    const action = searchParams.get('action');

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'Workspace ID is required' },
        { status: 400 }
      );
    }

    // Get specific user
    if (userId && action === 'single') {
      const user = await UserManagementService.getUserById(userId);
      return NextResponse.json(user);
    }

    // Get user statistics
    if (action === 'stats') {
      const stats = await UserManagementService.getUserStats(workspaceId);
      return NextResponse.json(stats);
    }

    // Get user activity
    if (userId && action === 'activity') {
      const limit = parseInt(searchParams.get('limit') || '50');
      const activity = await UserManagementService.getUserActivity(userId, limit);
      return NextResponse.json(activity);
    }

    // Get all users with filters
    const filters = {
      role: searchParams.get('role') || undefined,
      status: searchParams.get('status') || undefined,
      search: searchParams.get('search') || undefined,
      limit: parseInt(searchParams.get('limit') || '50'),
      offset: parseInt(searchParams.get('offset') || '0')
    };

    const result = await UserManagementService.getUsers(workspaceId, filters);
    return NextResponse.json(result);

  } catch (error) {
    console.error('Error in users API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'create') {
      const { name, email, phone, role, workspace_id, invited_by } = body;

      if (!name || !email || !role || !workspace_id || !invited_by) {
        return NextResponse.json(
          { error: 'Missing required fields' },
          { status: 400 }
        );
      }

      const user = await UserManagementService.createUser({
        name,
        email,
        phone,
        role,
        workspace_id,
        invited_by
      });

      return NextResponse.json(user, { status: 201 });
    }

    if (action === 'invite') {
      const { email, role, workspace_id, invited_by } = body;

      if (!email || !role || !workspace_id || !invited_by) {
        return NextResponse.json(
          { error: 'Missing required fields' },
          { status: 400 }
        );
      }

      const invitation = await UserManagementService.inviteUser(
        email,
        role,
        workspace_id,
        invited_by
      );

      return NextResponse.json(invitation, { status: 201 });
    }

    if (action === 'accept_invitation') {
      const { invitation_id, user_id } = body;

      if (!invitation_id || !user_id) {
        return NextResponse.json(
          { error: 'Missing required fields' },
          { status: 400 }
        );
      }

      await UserManagementService.acceptInvitation(invitation_id, user_id);
      return NextResponse.json({ success: true });
    }

    if (action === 'login') {
      const { user_id, ip_address } = body;

      if (!user_id) {
        return NextResponse.json(
          { error: 'User ID is required' },
          { status: 400 }
        );
      }

      await UserManagementService.updateLoginInfo(user_id, ip_address);
      return NextResponse.json({ success: true });
    }

    if (action === 'failed_login') {
      const { email, ip_address } = body;

      if (!email) {
        return NextResponse.json(
          { error: 'Email is required' },
          { status: 400 }
        );
      }

      await UserManagementService.recordFailedLogin(email, ip_address);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error in users API POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, updates } = body;

    if (!user_id || !updates) {
      return NextResponse.json(
        { error: 'User ID and updates are required' },
        { status: 400 }
      );
    }

    const updatedUser = await UserManagementService.updateUser(user_id, updates);
    return NextResponse.json(updatedUser);

  } catch (error) {
    console.error('Error in users API PUT:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const workspaceId = searchParams.get('workspaceId');

    if (!userId || !workspaceId) {
      return NextResponse.json(
        { error: 'User ID and workspace ID are required' },
        { status: 400 }
      );
    }

    await UserManagementService.deleteUser(userId, workspaceId);
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error in users API DELETE:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
