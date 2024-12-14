import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Hash } from 'lucide-react'

interface GroupInfoProps {
  group: {
    name: string
    members: string[]
    code: string
  }
}

export default function GroupInfo({ group }: GroupInfoProps) {
  return (
    <Card className="bg-blue-50 border-blue-200">
      <CardHeader className="bg-blue-100">
        <CardTitle className="flex items-center justify-between text-blue-700">
          <span>{group.name}</span>
          <Badge variant="secondary" className="text-sm bg-blue-200 text-blue-700">
            <Hash className="w-4 h-4 mr-1" />
            {group.code}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center text-blue-600">
            <Users className="w-5 h-5 mr-2" />
            <span className="font-semibold">Members:</span>
          </div>
          <ul className="list-disc list-inside pl-5 text-blue-700">
            {group.members.map((member, index) => (
              <li key={index}>{member}</li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}

