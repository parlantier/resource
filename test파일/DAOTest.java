package org.reply.contoller;

import org.junit.runner.RunWith;
import org.slf4j.LoggerFactory;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;

@RunWith(SpringJUnit4ClassRunner.class)
@ContextConfiguration(
		locations = {"file:src/main/webapp/WEB-INF/spring/**/*.xml"})
public class DAOTest {

	@Inject
	private
	
	private static final Logger logger =
						LoggerFactory.getLogger(DAOTest.class);
	
	@Test
	public void list()throws Exception{
		
		
		
	}

	
	@Test
	public void insert()throws Exception{
		
		
		
	}


	@Test
	public void update()throws Exception{
		
		
		
	}


	@Test
	public void delete()throws Exception{
		
		
		
	}
}
