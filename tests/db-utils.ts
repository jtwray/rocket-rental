import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { faker } from '@faker-js/faker'
import bcrypt from 'bcryptjs'
import { prisma } from '~/utils/db.server.ts'
import { memoizeUnique } from './memoize-unique.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const fixturesDirPath = path.join(__dirname, `../tests/fixtures`)

const unique = memoizeUnique(faker.internet.userName)

export function createContactInfo() {
	return {
		address: faker.location.streetAddress(),
		city: faker.location.city(),
		state: faker.location.state(),
		zip: faker.location.zipCode(),
		country: faker.location.country(),
		phone: faker.phone.number(),
	}
}

export function createUser() {
	const firstName = faker.person.firstName()
	const lastName = faker.person.lastName()

	const username = unique({
		firstName: firstName.toLowerCase(),
		lastName: lastName.toLowerCase(),
	})
	return {
		username,
		name: `${firstName} ${lastName}`,
		email: `${username}@example.com`,
	}
}

export const oneDay = 1000 * 60 * 60 * 24
export function createDateRange({
	start,
	end,
	maxDays,
}: {
	start: Date
	end: Date
	maxDays: number
}) {
	const randomStart = faker.date.between({
		from: start,
		to: end.getTime() - oneDay * 2,
	})
	const endStartRange = randomStart.getTime() + oneDay
	const endEndRange = Math.min(endStartRange + oneDay * maxDays, end.getTime())
	return {
		startDate: randomStart,
		endDate: faker.date.between({ from: endStartRange, to: endEndRange }),
	}
}

export function createBrand() {
	return {
		name: faker.company.name(),
		description: faker.company.buzzPhrase(),
	}
}

export function createShipModel() {
	return {
		name: faker.company.name(),
		description: faker.company.buzzPhrase(),
	}
}

export function createStarport() {
	return {
		name: faker.company.name(),
		description: faker.lorem.sentences(3),
		latitude: Number(faker.location.latitude()),
		longitude: Number(faker.location.longitude()),
	}
}

export function createPassword(username: string = faker.internet.userName()) {
	return {
		hash: bcrypt.hashSync(username, 10),
	}
}

export function createShip() {
	return {
		name: faker.lorem.word(),
		capacity: faker.number.int({ min: 1, max: 10 }),
		description: faker.lorem.sentences(3),
		dailyCharge: faker.number.int({ min: 100, max: 1000 }),
	}
}

export function createBooking({
	start,
	end,
	dailyCharge,
}: {
	start: Date
	end: Date
	dailyCharge: number
}) {
	const { startDate, endDate } = createDateRange({
		start,
		end,
		maxDays: 10,
	})
	const days = Math.ceil((endDate.getTime() - startDate.getTime()) / oneDay)

	const createdAt = faker.date.between({
		from: startDate.getTime() - oneDay * 10,
		to: startDate.getTime() - oneDay,
	})
	return {
		createdAt,
		updatedAt: createdAt,
		startDate,
		endDate,
		totalPrice: days * dailyCharge,
	}
}

export async function insertImage(imagePath: string) {
	const image = await prisma.image.create({
		data: await createImageFromFile(imagePath),
		select: { fileId: true },
	})
	return image.fileId
}

export async function createImageFromFile(imagePath: string) {
	const extension = path.extname(imagePath)
	return {
		contentType: `image/${extension.slice(1)}`,
		file: {
			create: {
				blob: await fs.promises.readFile(imagePath),
			},
		},
	}
}

export function getImagePath(
	type: 'user' | 'ship-brand' | 'ship-model' | 'ship' | 'starport',
	number: number = faker.number.int({ min: 1, max: 10 }),
) {
	const ext = type === 'ship' ? 'jpg' : 'png'
	const imageIndex = number % 10
	return path.join(fixturesDirPath, 'images', type, `${imageIndex}.${ext}`)
}
