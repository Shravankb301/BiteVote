import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { nanoid } from 'nanoid'

interface GroupCreationProps {
  onGroupCreated: (group: { name: string; members: string[]; code: string }) => void
}

export default function GroupCreation({ onGroupCreated }: GroupCreationProps) {
  const [groupName, setGroupName] = useState('')
  const [members, setMembers] = useState('')

  const handleCreateGroup = () => {
    if (!groupName.trim()) return
    
    const group = {
      name: groupName,
      members: members.split(',').map(member => member.trim()).filter(Boolean),
      code: nanoid(4)
    }
    onGroupCreated(group)
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="groupName" className="text-blue-600">Group Name</Label>
        <Input
          id="groupName"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          placeholder="Enter group name"
          className="border-blue-300 focus:border-blue-500 focus:ring-blue-500"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="members" className="text-blue-600">Members (comma-separated)</Label>
        <Input
          id="members"
          value={members}
          onChange={(e) => setMembers(e.target.value)}
          placeholder="John, Jane, Alex"
          className="border-blue-300 focus:border-blue-500 focus:ring-blue-500"
        />
      </div>
      <Button 
        className="w-full bg-blue-500 hover:bg-blue-600 text-white"
        onClick={handleCreateGroup}
        disabled={!groupName.trim()}
      >
        Create Group
      </Button>
    </div>
  )
}

