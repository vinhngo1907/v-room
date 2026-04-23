
## Microservices for beginners. Common code. Typescript.

Full code - [link](https://github.com/vinhngo1907/v-room)

In previous articles I described how to create several services and how to work with them. But sometimes microservices in one project contain a lot of similar code, and I want to reuse it. For example I use a common type for user entities in the api gateway and in the user service - `WebUserDto`.

``` typescript
export class WebUserDto {
  @ApiProperty({ description: 'Id of user', nullable: false })
  id: string;

  @ApiProperty({ description: 'Login of user', nullable: false })
  login: string;

  @ApiProperty({ description: 'Email of user', nullable: false })
  email: string;

  @ApiProperty({ description: 'Flag of user active', nullable: false })
  active: boolean;

  @ApiProperty({ description: 'Date of user creation', nullable: false })
  created_at: Date;
}
```

So I made a new project in Github and put all the common DTO inside and built a typescript library.

#### Installation requirements

Installation
``` typescript
npm install typescript
npm install --save @nestjs/swagger
```

Initiation tsconfig.json
```
npx tsc --init
```

Building
```
npx tsc
```

Right now I can use common code as npm library in other projects - `"v-dto": "github:vinhngo1907/v-room/libs/v-dto#main",`.

